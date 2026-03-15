const { z } = require('zod');
const { success, error, paginated, getPagination, buildPaginationMeta } = require('../utils/response');
const { analyticsQueue, notifyQueue } = require('../lib/queues');

const prisma = require('../lib/prisma');

const createReviewSchema = z.object({
  revieweeId: z.string().uuid(),
  contextType: z.enum(['service_request', 'job', 'project']),
  contextId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().optional(),
  communicationRating:   z.number().int().min(1).max(5).optional(),
  qualityRating:         z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  timelinessRating:      z.number().int().min(1).max(5).optional(),
});

const createReview = async (req, res, next) => {
  try {
    const data = createReviewSchema.parse(req.body);

    // Can't review yourself
    if (data.revieweeId === req.user.id) {
      return error(res, 'You cannot review yourself', 400, 'VALIDATION_ERROR');
    }

    // Verify reviewee exists
    const reviewee = await prisma.user.findUnique({
      where: { id: data.revieweeId, isActive: true },
      select: { id: true, firstName: true },
    });
    if (!reviewee) return error(res, 'User not found', 404, 'NOT_FOUND');

    // Verify the context exists, is completed, and the reviewer was actually involved
    let contextValid = false;

    if (data.contextType === 'service_request') {
      const sr = await prisma.serviceRequest.findUnique({ where: { id: data.contextId } });
      if (!sr) return error(res, 'Service request not found', 404, 'NOT_FOUND');
      if (sr.status !== 'completed') return error(res, 'Service request is not completed yet', 400, 'VALIDATION_ERROR');
      // Reviewer must be client or the assigned provider's user
      const assignedProvider = sr.assignedProviderId
        ? await prisma.providerProfile.findUnique({ where: { id: sr.assignedProviderId }, select: { userId: true } })
        : null;
      const involvedIds = [sr.clientId, assignedProvider?.userId].filter(Boolean);
      if (!involvedIds.includes(req.user.id)) return error(res, 'You were not part of this service request', 403, 'FORBIDDEN');
      contextValid = true;

    } else if (data.contextType === 'job') {
      const job = await prisma.jobPosting.findUnique({ where: { id: data.contextId } });
      if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
      if (job.status !== 'filled') return error(res, 'Job is not completed yet', 400, 'VALIDATION_ERROR');
      // Reviewer must be employer or a hired applicant
      const hiredApp = await prisma.jobApplication.findFirst({
        where: { jobPostingId: data.contextId, applicantId: req.user.id, status: 'hired' },
      });
      const involvedIds = [job.employerId, hiredApp?.applicantId].filter(Boolean);
      if (!involvedIds.includes(req.user.id)) return error(res, 'You were not part of this job', 403, 'FORBIDDEN');
      contextValid = true;

    } else if (data.contextType === 'project') {
      const project = await prisma.project.findUnique({ where: { id: data.contextId } });
      if (!project) return error(res, 'Project not found', 404, 'NOT_FOUND');
      if (project.status !== 'completed') return error(res, 'Project is not completed yet', 400, 'VALIDATION_ERROR');
      const assignedProvider = project.assignedProviderId
        ? await prisma.providerProfile.findUnique({ where: { id: project.assignedProviderId }, select: { userId: true } })
        : null;
      const involvedIds = [project.clientId, assignedProvider?.userId].filter(Boolean);
      if (!involvedIds.includes(req.user.id)) return error(res, 'You were not part of this project', 403, 'FORBIDDEN');
      contextValid = true;
    }

    if (!contextValid) return error(res, 'Invalid context', 400, 'VALIDATION_ERROR');

    // One review per person per context
    const existing = await prisma.review.findFirst({
      where: { reviewerId: req.user.id, contextType: data.contextType, contextId: data.contextId },
    });
    if (existing) return error(res, 'You have already reviewed this', 409, 'CONFLICT');

    // Create the review
    const review = await prisma.review.create({
      data: {
        ...data,
        reviewerId: req.user.id,
        isVerified: true, // verified because we confirmed the context above
      },
      include: {
        reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Queue provider stats recalc
    const providerProfile = await prisma.providerProfile.findFirst({
      where: { userId: data.revieweeId },
      select: { id: true },
    });
    if (providerProfile) {
      await analyticsQueue.add('update-provider-stats', { providerId: providerProfile.id });
    }

    // Notify reviewee
    await notifyQueue.add('send', {
      userId: data.revieweeId,
      type: 'review',
      title: 'You received a new review',
      body: `Someone left you a ${data.rating}-star review.`,
      contextType: data.contextType,
      contextId: data.contextId,
      actionUrl: `/profile/reviews`,
    });

    return success(res, review, 201);
  } catch (err) {
    next(err);
  }
};

const getReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: { reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
    if (!review || review.isHidden) return error(res, 'Review not found', 404, 'NOT_FOUND');
    return success(res, review);
  } catch (err) {
    next(err);
  }
};

const getReviews = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { contextType, contextId } = req.query;
    const where = { isHidden: false };
    if (contextType) where.contextType = contextType;
    if (contextId) where.contextId = contextId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      prisma.review.count({ where }),
    ]);
    return paginated(res, reviews, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return error(res, 'Review not found', 404, 'NOT_FOUND');
    if (review.reviewerId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const { rating, title, content, communicationRating, qualityRating, professionalismRating, timelinessRating } = req.body;
    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { rating, title, content, communicationRating, qualityRating, professionalismRating, timelinessRating },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) return error(res, 'Review not found', 404, 'NOT_FOUND');
    if (review.reviewerId !== req.user.id && !req.user.isAdmin) return error(res, 'Access denied', 403, 'FORBIDDEN');

    await prisma.review.update({ where: { id: req.params.id }, data: { isHidden: true } });
    return success(res, { message: 'Review removed' });
  } catch (err) {
    next(err);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    // Minimal implementation: return empty list for now
    return success(res, []);
  } catch (err) {
    next(err);
  }
};

const respondToReview = async (req, res, next) => {
  try {
    // Minimal implementation: acknowledge the response
    return success(res, { message: 'Response recorded (stub)' });
  } catch (err) {
    next(err);
  }
};

// ── Added missing handlers ────────────────────────────────────────────────────

const getMyReviewsGiven = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { reviewerId: req.user.id, isHidden: false },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { reviewee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      prisma.review.count({ where: { reviewerId: req.user.id, isHidden: false } }),
    ]);
    return paginated(res, reviews, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getMyReviewsReceived = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: req.user.id, isHidden: false },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      prisma.review.count({ where: { revieweeId: req.user.id, isHidden: false } }),
    ]);
    return paginated(res, reviews, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getReviews, getReview, updateReview, deleteReview, getUserReviews, respondToReview, getMyReviewsGiven, getMyReviewsReceived };

const { z } = require('zod');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');
const { notifyQueue } = require('../lib/queues');

const prisma = require('../lib/prisma');

const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5),
  description: z.string().min(10),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
  addressLine1: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  preferredDate: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  budgetType: z.enum(['fixed', 'hourly', 'negotiable']).optional(),
  images: z.array(z.string()).optional(),
});

const createQuoteSchema = z.object({
  price: z.number().positive(),
  pricingType: z.enum(['fixed', 'hourly', 'per-item']).optional(),
  estimatedHours: z.number().optional(),
  message: z.string().min(10),
  availabilityDate: z.string().optional(),
  completionEstimate: z.string().optional(),
});

// ── Service Requests ──────────────────────────────────────────────────────────

const getRequests = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const where = { clientId: req.user.id, deletedAt: undefined };

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { category: true, assignedProvider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return paginated(res, requests, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const data = createRequestSchema.parse(req.body);

    const request = await prisma.serviceRequest.create({
      data: {
        ...data,
        clientId: req.user.id,
      },
      include: { category: true },
    });

    return success(res, request, 201);
  } catch (err) {
    next(err);
  }
};

const getRequest = async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        assignedProvider: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        quotes: { include: { provider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } } },
      },
    });

    if (!request) return error(res, 'Request not found', 404, 'NOT_FOUND');

    return success(res, request);
  } catch (err) {
    next(err);
  }
};

const updateRequest = async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return error(res, 'Request not found', 404, 'NOT_FOUND');
    if (request.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');
    if (request.status !== 'open') return error(res, 'Cannot edit a non-open request', 400, 'VALIDATION_ERROR');

    // Validate input: only allow certain fields to be updated
    const allowedFields = ['title', 'description', 'budgetMin', 'budgetMax', 'dueDate', 'categoryId'];
    const updateData = {};
    for (const field of allowedFields) {
      if (field in req.body) updateData[field] = req.body[field];
    }

    // Validate budget if present
    if (updateData.budgetMin || updateData.budgetMax) {
      const min = updateData.budgetMin || request.budgetMin;
      const max = updateData.budgetMax || request.budgetMax;
      if (typeof min !== 'number' || typeof max !== 'number' || min < 0 || max < 0) {
        return error(res, 'Budget must be positive numbers', 400, 'VALIDATION_ERROR');
      }
      if (min > max) {
        return error(res, 'Min budget cannot exceed max budget', 400, 'VALIDATION_ERROR');
      }
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return error(res, 'Request not found', 404, 'NOT_FOUND');
    if (request.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');
    if (['completed', 'cancelled'].includes(request.status)) {
      return error(res, 'Request cannot be cancelled', 400, 'VALIDATION_ERROR');
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ── Quotes ────────────────────────────────────────────────────────────────────

const getQuotes = async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return error(res, 'Request not found', 404, 'NOT_FOUND');
    if (request.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const quotes = await prisma.serviceQuote.findMany({
      where: { serviceRequestId: req.params.id },
      include: {
        provider: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, quotes);
  } catch (err) {
    next(err);
  }
};

const createQuote = async (req, res, next) => {
  try {
    const data = createQuoteSchema.parse(req.body);

    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');

    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return error(res, 'Request not found', 404, 'NOT_FOUND');
    if (request.status !== 'open') return error(res, 'Request is no longer open for quotes', 400, 'VALIDATION_ERROR');

    const existing = await prisma.serviceQuote.findUnique({
      where: { serviceRequestId_providerId: { serviceRequestId: req.params.id, providerId: providerProfile.id } },
    });
    if (existing) return error(res, 'You have already submitted a quote', 409, 'CONFLICT');

    const quote = await prisma.serviceQuote.create({
      data: { ...data, serviceRequestId: req.params.id, providerId: providerProfile.id },
    });

    return success(res, quote, 201);
  } catch (err) {
    next(err);
  }
};

const acceptQuote = async (req, res, next) => {
  try {
    const quote = await prisma.serviceQuote.findUnique({
      where: { id: req.params.id },
      include: { serviceRequest: true },
    });
    if (!quote) return error(res, 'Quote not found', 404, 'NOT_FOUND');
    if (quote.serviceRequest.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');
    if (quote.status !== 'pending') return error(res, 'Quote is no longer pending', 400, 'VALIDATION_ERROR');

    await prisma.$transaction([
      prisma.serviceQuote.update({
        where: { id: req.params.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
      prisma.serviceQuote.updateMany({
        where: { serviceRequestId: quote.serviceRequestId, id: { not: req.params.id } },
        data: { status: 'rejected', rejectedAt: new Date() },
      }),
      prisma.serviceRequest.update({
        where: { id: quote.serviceRequestId },
        data: { status: 'assigned', assignedProviderId: quote.providerId },
      }),
    ]);
    await notifyQueue.add('send', {
        userId: quote.provider.userId,
        type: 'booking',
        title: 'Your quote was accepted!',
        body: `Your quote for "${quote.serviceRequest.title}" has been accepted.`,
        contextType: 'service_request',
        contextId: quote.serviceRequestId,
    });

    return success(res, { message: 'Quote accepted' });
  } catch (err) {
    next(err);
  }
};

const rejectQuote = async (req, res, next) => {
  try {
    const quote = await prisma.serviceQuote.findUnique({
      where: { id: req.params.id },
      include: { serviceRequest: true },
    });
    if (!quote) return error(res, 'Quote not found', 404, 'NOT_FOUND');
    if (quote.serviceRequest.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    await prisma.serviceQuote.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectedAt: new Date() },
    });

    return success(res, { message: 'Quote rejected' });
  } catch (err) {
    next(err);
  }
};

// Browse open service requests — for providers to discover work available
const browseOpenRequests = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { categoryId, q } = req.query;

    const where = { status: 'open' };
    if (categoryId) where.categoryId = categoryId;
    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          client: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, city: true } },
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return paginated(res, requests, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

// ── Browse ────────────────────────────────────────────────────────────────────

const browse = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { categoryId } = req.query;

    // No verification/availability gate — show all providers so new providers are discoverable
    const where = {};
    if (categoryId) where.skills = { some: { skill: { categoryId } } };

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        skip,
        take: perPage,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, city: true, state: true } },
          skills: { include: { skill: true } },
        },
        orderBy: { averageRating: 'desc' },
      }),
      prisma.providerProfile.count({ where }),
    ]);

    // Normalize to ProviderPublicProfile shape expected by the frontend
    const normalized = providers.map(p => ({
      id: p.id,
      userId: p.user.id,
      displayName: p.user.displayName || `${p.user.firstName} ${p.user.lastName}`.trim(),
      avatarUrl: p.user.avatarUrl || null,
      title: p.title || '',
      bio: p.tagline || '',
      hourlyRate: p.hourlyRate ? parseFloat(p.hourlyRate) : null,
      location: (p.user.city || p.user.state) ? { city: p.user.city || '', state: p.user.state || '', country: 'US' } : null,
      skills: p.skills.map(s => s.skill.name),
      ratings: parseFloat(p.averageRating) || 0,
      reviewsCount: p.totalReviews || 0,
      completedJobs: p.totalJobsCompleted || 0,
      verificationStatus: p.verificationStatus,
      isAvailable: p.isAvailable,
    }));

    return paginated(res, normalized, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

module.exports = { getRequests, createRequest, getRequest, updateRequest, cancelRequest, getQuotes, createQuote, acceptQuote, rejectQuote, browse, browseOpenRequests };

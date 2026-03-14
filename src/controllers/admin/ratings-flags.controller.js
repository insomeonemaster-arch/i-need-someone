const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../../utils/response');
const { logAdminAction, AdminActions } = require('../../utils/auditLog');

const prisma = new PrismaClient();

// ─── RATINGS ──────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/ratings
 * List all ratings
 */
const getRatings = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { flagged, admin_reviewed, rating, entity_type } = req.query;

    const where = {};
    if (flagged === 'true') where.isFlagged = true;
    if (admin_reviewed === 'true') where.adminReviewed = true;
    if (admin_reviewed === 'false') where.adminReviewed = false;
    if (rating) where.rating = parseInt(rating);
    if (entity_type) where.contextType = entity_type;

    const [ratings, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          reviewee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const ratingsData = ratings.map((r) => ({
      id: r.id,
      rating_id: `RAT-${r.id.substring(0, 8)}`,
      rater: {
        id: r.reviewer.id,
        name: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
      },
      rated_user: {
        id: r.reviewee.id,
        name: `${r.reviewee.firstName} ${r.reviewee.lastName}`,
      },
      entity_type: r.contextType,
      entity_id: r.contextId,
      entity_display: `${r.contextType.toUpperCase()}-${r.contextId.substring(0, 8)}`,
      rating: r.rating,
      review_text: r.content,
      flagged: r.isFlagged,
      flag_reason: r.flagReason,
      admin_reviewed: r.adminReviewed,
      admin_action: r.adminAction,
      created_at: r.createdAt,
    }));

    return paginated(res, ratingsData, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get ratings error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/ratings/:id
 * Get detailed rating information
 */
const getRating = async (req, res, next) => {
  try {
    const rating = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        reviewer: true,
        reviewee: true,
      },
    });

    if (!rating) {
      return error(res, 'Rating not found', 404, 'RATING_NOT_FOUND');
    }

    return success(res, {
      id: rating.id,
      rating_id: `RAT-${rating.id.substring(0, 8)}`,
      rater: rating.reviewer,
      rated_user: rating.reviewee,
      entity_type: rating.contextType,
      entity_id: rating.contextId,
      rating: rating.rating,
      review_text: rating.content,
      communication_rating: rating.communicationRating,
      quality_rating: rating.qualityRating,
      professionalism_rating: rating.professionalismRating,
      timeliness_rating: rating.timelinessRating,
      flagged: rating.isFlagged,
      flag_reason: rating.flagReason,
      admin_reviewed: rating.adminReviewed,
      admin_action: rating.adminAction,
      is_hidden: rating.isHidden,
      created_at: rating.createdAt,
    });
  } catch (err) {
    console.error('Get rating error:', err);
    next(err);
  }
};

/**
 * PATCH /api/admin/ratings/:id
 * Admin action on rating
 */
const updateRating = async (req, res, next) => {
  try {
    const { admin_action, admin_notes } = req.body;

    const updateData = {
      adminReviewed: true,
      adminAction: admin_action,
    };

    if (admin_action === 'hidden') {
      updateData.isHidden = true;
    } else if (admin_action === 'removed') {
      updateData.isHidden = true;
      // Could also delete the rating if needed
    } else if (admin_action === 'approved') {
      updateData.isHidden = false;
      updateData.isFlagged = false;
    }

    await prisma.review.update({
      where: { id: req.params.id },
      data: updateData,
    });

    let action;
    if (admin_action === 'hidden') action = AdminActions.RATING_HIDDEN;
    else if (admin_action === 'removed') action = AdminActions.RATING_REMOVED;
    else action = AdminActions.RATING_APPROVED;

    await logAdminAction({
      userId: req.user.id,
      action,
      resourceType: 'rating',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { admin_notes },
    });

    return success(res, {
      message: 'Rating updated successfully',
    });
  } catch (err) {
    console.error('Update rating error:', err);
    next(err);
  }
};

// ─── FLAGS ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/flags
 * List all flags
 */
const getFlags = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status, flagged_entity_type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (flagged_entity_type) where.flaggedEntityType = flagged_entity_type;

    const [flags, total] = await Promise.all([
      prisma.flag.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          flagger: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.flag.count({ where }),
    ]);

    const flagsData = flags.map((f) => ({
      id: f.id,
      flag_id: f.flagId,
      flagger: {
        id: f.flagger.id,
        name: `${f.flagger.firstName} ${f.flagger.lastName}`,
      },
      flagged_entity_type: f.flaggedEntityType,
      flagged_entity_id: f.flaggedEntityId,
      flagged_entity_display: `${f.flaggedEntityType.toUpperCase()}-${f.flaggedEntityId.substring(0, 8)}`,
      reason: f.reason,
      description: f.description,
      status: f.status,
      assigned_admin: f.admin
        ? {
            id: f.admin.id,
            name: `${f.admin.firstName} ${f.admin.lastName}`,
          }
        : null,
      created_at: f.createdAt,
    }));

    return paginated(res, flagsData, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get flags error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/flags/:id
 * Get detailed flag information
 */
const getFlag = async (req, res, next) => {
  try {
    const flag = await prisma.flag.findUnique({
      where: { id: req.params.id },
      include: {
        flagger: true,
        admin: true,
      },
    });

    if (!flag) {
      return error(res, 'Flag not found', 404, 'FLAG_NOT_FOUND');
    }

    return success(res, {
      id: flag.id,
      flag_id: flag.flagId,
      flagger: flag.flagger,
      flagged_entity_type: flag.flaggedEntityType,
      flagged_entity_id: flag.flaggedEntityId,
      reason: flag.reason,
      description: flag.description,
      status: flag.status,
      admin: flag.admin,
      admin_notes: flag.adminNotes,
      resolution: flag.resolution,
      created_at: flag.createdAt,
      resolved_at: flag.resolvedAt,
    });
  } catch (err) {
    console.error('Get flag error:', err);
    next(err);
  }
};

/**
 * PATCH /api/admin/flags/:id/resolve
 * Resolve a flag
 */
const resolveFlag = async (req, res, next) => {
  try {
    const { resolution, admin_notes } = req.body;

    await prisma.flag.update({
      where: { id: req.params.id },
      data: {
        status: 'resolved',
        resolution,
        adminNotes: admin_notes,
        adminId: req.user.id,
        resolvedAt: new Date(),
      },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.FLAG_RESOLVED,
      resourceType: 'flag',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { resolution, admin_notes },
    });

    return success(res, {
      message: 'Flag resolved successfully',
    });
  } catch (err) {
    console.error('Resolve flag error:', err);
    next(err);
  }
};

module.exports = {
  getRatings,
  getRating,
  updateRating,
  getFlags,
  getFlag,
  resolveFlag,
};

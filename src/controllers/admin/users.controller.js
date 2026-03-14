const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../../utils/response');
const { logAdminAction, AdminActions } = require('../../utils/auditLog');

const prisma = new PrismaClient();

/**
 * GET /api/admin/users
 * List all users with filtering
 */
const getUsers = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { q, status, role, city, verified } = req.query;

    const where = { deletedAt: null };

    // Search query
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    // Status filter
    if (status === 'active') where.isActive = true;
    if (status === 'suspended') where.isActive = false;

    // Role filter
    if (role === 'provider') where.isProvider = true;
    if (role === 'admin') where.isAdmin = true;

    // City filter
    if (city) where.city = { contains: city, mode: 'insensitive' };

    // Verified filter
    if (verified === 'true') {
      where.AND = [{ isEmailVerified: true }, { isPhoneVerified: true }];
    } else if (verified === 'false') {
      where.OR = [{ isEmailVerified: false }, { isPhoneVerified: false }];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
          isProvider: true,
          isAdmin: true,
          city: true,
          state: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          createdAt: true,
          lastLoginAt: true,
          providerProfile: {
            select: {
              averageRating: true,
              totalReviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(
      res,
      users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        first_name: u.firstName,
        last_name: u.lastName,
        avatar: u.avatarUrl,
        roles: [
          ...(u.isProvider ? ['provider'] : []),
          ...(u.isAdmin ? ['admin'] : []),
          'customer',
        ],
        status: u.isActive ? 'active' : 'suspended',
        city: u.city,
        state: u.state,
        email_verified: u.isEmailVerified,
        phone_verified: u.isPhoneVerified,
        rating_avg: u.providerProfile ? Number(u.providerProfile.averageRating) : null,
        rating_count: u.providerProfile ? u.providerProfile.totalReviews : 0,
        created_at: u.createdAt,
        last_login_at: u.lastLoginAt,
      })),
      buildPaginationMeta(total, page, perPage)
    );
  } catch (err) {
    console.error('Get users error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Get detailed user information
 */
const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        providerProfile: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
            certifications: true,
          },
        },
      },
    });

    if (!user) {
      return error(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    // Get statistics
    const [requestsCreated, jobsPosted, projectsCreated, totalSpent, totalEarned, ratings, flags] =
      await Promise.all([
        prisma.serviceRequest.count({ where: { clientId: user.id } }),
        prisma.jobPosting.count({ where: { employerId: user.id } }),
        prisma.project.count({ where: { clientId: user.id } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { payerId: user.id, status: 'completed' },
        }),
        prisma.payment.aggregate({
          _sum: { netAmount: true },
          where: { payeeId: user.id, status: 'completed' },
        }),
        prisma.review.findMany({
          where: { revieweeId: user.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        }),
        prisma.flag.findMany({
          where: { flaggedEntityType: 'user', flaggedEntityId: user.id },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    // Get recent activity
    const recentActivity = await prisma.userActivityLog.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    const userData = {
      id: user.id,
      user_id: `USR-${user.id.substring(0, 8)}`,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: [
        ...(user.isProvider ? ['provider'] : []),
        ...(user.isAdmin ? ['admin'] : []),
        'customer',
      ],
      status: user.isActive ? 'active' : 'suspended',
      avatar: user.avatarUrl,
      city: user.city,
      state: user.state,
      country: user.country,
      email_verified: user.isEmailVerified,
      phone_verified: user.isPhoneVerified,
      stats: {
        total_requests: requestsCreated,
        total_jobs_posted: jobsPosted,
        total_projects: projectsCreated,
        total_spent: Number(totalSpent._sum.amount || 0),
        total_earned: Number(totalEarned._sum.netAmount || 0),
        rating_avg: user.providerProfile ? Number(user.providerProfile.averageRating) : 0,
        rating_count: user.providerProfile ? user.providerProfile.totalReviews : 0,
      },
      recent_activity: recentActivity.map((log) => ({
        type: log.action,
        entity_id: log.resourceId,
        description: `${log.action}`,
        timestamp: log.createdAt,
      })),
      ratings: ratings.map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.content,
        reviewer: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
        created_at: r.createdAt,
      })),
      flags: flags.map((f) => ({
        id: f.id,
        flag_id: f.flagId,
        reason: f.reason,
        status: f.status,
        created_at: f.createdAt,
      })),
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt,
    };

    return success(res, userData);
  } catch (err) {
    console.error('Get user error:', err);
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id
 * Update user information (admin action)
 */
const updateUser = async (req, res, next) => {
  try {
    const { status, admin_notes, reason } = req.body;

    const beforeUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!beforeUser) {
      return error(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    const updateData = {};
    if (status === 'active') updateData.isActive = true;
    if (status === 'suspended') updateData.isActive = false;

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Log the action
    await logAdminAction({
      userId: req.user.id,
      action: status === 'suspended' ? AdminActions.USER_SUSPENDED : AdminActions.USER_UPDATED,
      resourceType: 'user',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { reason, admin_notes },
    });

    return success(res, {
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update user error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user
 */
const suspendUser = async (req, res, next) => {
  try {
    const { reason, notes, duration_days } = req.body;

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    // Invalidate all sessions
    await prisma.userSession.deleteMany({
      where: { userId: req.params.id },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.USER_SUSPENDED,
      resourceType: 'user',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { reason, notes, duration_days },
    });

    return success(res, {
      message: 'User suspended successfully',
    });
  } catch (err) {
    console.error('Suspend user error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/unsuspend
 * Unsuspend a user
 */
const unsuspendUser = async (req, res, next) => {
  try {
    const { notes } = req.body;

    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.USER_UNSUSPENDED,
      resourceType: 'user',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { notes },
    });

    return success(res, {
      message: 'User unsuspended successfully',
    });
  } catch (err) {
    console.error('Unsuspend user error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/users/:id/verify
 * Manually verify user email or phone
 */
const verifyUser = async (req, res, next) => {
  try {
    const { verification_type, admin_notes } = req.body;

    const updateData = {};
    if (verification_type === 'email') {
      updateData.isEmailVerified = true;
    } else if (verification_type === 'phone') {
      updateData.isPhoneVerified = true;
    }

    await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.USER_VERIFIED,
      resourceType: 'user',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { verification_type, admin_notes },
    });

    return success(res, {
      message: `User ${verification_type} verified successfully`,
    });
  } catch (err) {
    console.error('Verify user error:', err);
    next(err);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  suspendUser,
  unsuspendUser,
  verifyUser,
};

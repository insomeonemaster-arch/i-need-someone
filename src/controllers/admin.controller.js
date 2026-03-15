const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');
const { logAdminAction } = require('../utils/auditLog');

const prisma = new PrismaClient();

// ── Users ─────────────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { q, isActive, isProvider } = req.query;

    const where = {};
    if (q) where.OR = [{ email: { contains: q, mode: 'insensitive' } }, { firstName: { contains: q, mode: 'insensitive' } }];
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isProvider !== undefined) where.isProvider = isProvider === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          isActive: true, isProvider: true, isAdmin: true, createdAt: true, lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    return paginated(res, users, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        providerProfile: true,
        _count: {
          select: {
            serviceRequests: true,
            jobPostings: true,
            projects: true,
            reviewsGiven: true,
            reviewsReceived: true,
            conversationsAsP1: true,
            conversationsAsP2: true,
          },
        },
      },
    });
    if (!user) return error(res, 'User not found', 404, 'NOT_FOUND');
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    await prisma.userSession.deleteMany({ where: { userId: req.params.id } });
    return success(res, { message: 'User suspended' });
  } catch (err) {
    next(err);
  }
};

const unsuspendUser = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: true } });
    return success(res, { message: 'User unsuspended' });
  } catch (err) {
    next(err);
  }
};

// ── Reports ───────────────────────────────────────────────────────────────────

const getReports = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { reporter: { select: { id: true, email: true, firstName: true } } },
      }),
      prisma.report.count({ where }),
    ]);
    return paginated(res, reports, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const actionReport = async (req, res, next) => {
  try {
    const { status, actionTaken, adminNotes } = req.body;
    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: { status, actionTaken, adminNotes, assignedToAdminId: req.user.id, reviewedAt: new Date() },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ── Disputes ──────────────────────────────────────────────────────────────────

const getDisputes = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({ skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      prisma.dispute.count(),
    ]);
    return paginated(res, disputes, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const resolveDispute = async (req, res, next) => {
  try {
    const { resolutionNotes, resolutionAction, refundAmount } = req.body;
    const updated = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status: 'resolved',
        resolutionNotes, resolutionAction,
        refundAmount: refundAmount || null,
        assignedToAdminId: req.user.id,
        resolvedAt: new Date(),
      },
    });
    await logAdminAction({
      userId: req.user.id,
      action: 'dispute.resolved',
      resourceType: 'Dispute',
      resourceId: req.params.id,
      changes: { resolutionAction, refundAmount: refundAmount || null },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ── Verification ──────────────────────────────────────────────────────────────

const getPendingVerifications = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [docs, total] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: { verificationStatus: 'pending' },
        skip, take: perPage,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.verificationDocument.count({ where: { verificationStatus: 'pending' } }),
    ]);
    return paginated(res, docs, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const approveDocument = async (req, res, next) => {
  try {
    const updated = await prisma.verificationDocument.update({
      where: { id: req.params.id },
      data: { verificationStatus: 'verified' },
    });

    // If all documents for this user are now verified, mark the provider profile as verified
    const pendingCount = await prisma.verificationDocument.count({
      where: { userId: updated.userId, verificationStatus: { not: 'verified' } },
    });
    if (pendingCount === 0) {
      await prisma.providerProfile.upsert({
        where: { userId: updated.userId },
        update: { verificationStatus: 'verified', verifiedAt: new Date() },
        create: { userId: updated.userId, verificationStatus: 'verified', verifiedAt: new Date() },
      });
    }

    await logAdminAction({
      userId: req.user.id,
      action: 'document.approved',
      resourceType: 'VerificationDocument',
      resourceId: req.params.id,
      changes: { verificationStatus: { from: 'pending', to: 'verified' }, documentUserId: updated.userId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const rejectDocument = async (req, res, next) => {
  try {
    const updated = await prisma.verificationDocument.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'rejected',
        rejectionReason: req.body.reason,
      },
    });

    // Mark the provider profile as rejected
    await prisma.providerProfile.upsert({
      where: { userId: updated.userId },
      update: { verificationStatus: 'rejected' },
      create: { userId: updated.userId, verificationStatus: 'rejected' },
    });

    await logAdminAction({
      userId: req.user.id,
      action: 'document.rejected',
      resourceType: 'VerificationDocument',
      resourceId: req.params.id,
      changes: { verificationStatus: { from: 'pending', to: 'rejected' }, reason: req.body.reason, documentUserId: updated.userId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ── Analytics ─────────────────────────────────────────────────────────────────

const getOverview = async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, totalProviders, verifiedProviders,
      openRequests, openJobs, openProjects,
      totalTransactions, revenueData,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isProvider: true } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'verified' } }),
      prisma.serviceRequest.count({ where: { status: 'open' } }),
      prisma.jobPosting.count({ where: { status: 'open' } }),
      prisma.project.count({ where: { status: 'open' } }),
      prisma.transaction.count({ where: { status: 'completed' } }),
      prisma.transaction.aggregate({ where: { status: 'completed' }, _sum: { amount: true, platformFee: true } }),
    ]);

    return success(res, {
      users: { total: totalUsers, active: activeUsers },
      providers: { total: totalProviders, verified: verifiedProviders },
      listings: { requests: openRequests, jobs: openJobs, projects: openProjects },
      transactions: { completed: totalTransactions, volume: revenueData._sum.amount, revenue: revenueData._sum.platformFee },
    });
  } catch (err) {
    next(err);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, imageUrl, targetAudience, priority, publishAt, expireAt } = req.body;
    const announcement = await prisma.announcement.create({
      data: { title, body, imageUrl, targetAudience: targetAudience || 'all', priority: priority || 'normal', publishAt: publishAt ? new Date(publishAt) : new Date(), expireAt: expireAt ? new Date(expireAt) : null },
    });
    return success(res, announcement, 201);
  } catch (err) {
    next(err);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const updated = await prisma.announcement.update({ where: { id: req.params.id }, data: req.body });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    await prisma.announcement.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, { message: 'Announcement deactivated' });
  } catch (err) {
    next(err);
  }
};

// ── Support Tickets (Admin) ───────────────────────────────────────────────────

const adminGetTickets = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status, priority } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where, skip, take: perPage,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return paginated(res, tickets, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const adminAssignTicket = async (req, res, next) => {
  try {
    const updated = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { assignedToAdminId: req.body.adminId || req.user.id, status: 'in-progress' },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const adminReplyTicket = async (req, res, next) => {
  try {
    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: req.params.id,
        senderId: req.user.id,
        message: req.body.message,
        isInternalNote: req.body.isInternalNote || false,
      },
    });
    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: req.body.isInternalNote ? undefined : 'waiting-user', updatedAt: new Date() },
    });
    return success(res, message, 201);
  } catch (err) {
    next(err);
  }
};

// ── Extended Analytics ────────────────────────────────────────────────────────

const getUsersAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [total, newLast30, newLast7, providers, verified] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { isProvider: true } }),
      prisma.providerProfile.count({ where: { verificationStatus: 'verified' } }),
    ]);

    return success(res, { total, newLast30Days: newLast30, newLast7Days: newLast7, providers, verifiedProviders: verified });
  } catch (err) {
    next(err);
  }
};

const getTransactionsAnalytics = async (req, res, next) => {
  try {
    const [completed, pending, failed, volume] = await Promise.all([
      prisma.transaction.count({ where: { status: 'completed' } }),
      prisma.transaction.count({ where: { status: 'pending' } }),
      prisma.transaction.count({ where: { status: 'failed' } }),
      prisma.transaction.aggregate({ where: { status: 'completed' }, _sum: { amount: true, platformFee: true } }),
    ]);

    return success(res, {
      completed, pending, failed,
      totalVolume: volume._sum.amount || 0,
      totalRevenue: volume._sum.platformFee || 0,
    });
  } catch (err) {
    next(err);
  }
};

const getActivityAnalytics = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activity = await prisma.userActivityLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: since } },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    });

    return success(res, activity.map(a => ({ action: a.action, count: a._count.action })));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers, getUser, suspendUser, unsuspendUser,
  getReports, actionReport,
  getDisputes, resolveDispute,
  getPendingVerifications, approveDocument, rejectDocument,
  getOverview,
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  adminGetTickets, adminAssignTicket, adminReplyTicket,
  getUsersAnalytics, getTransactionsAnalytics, getActivityAnalytics,
};

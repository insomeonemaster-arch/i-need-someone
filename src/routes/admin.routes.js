const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminAuth');

// Import admin controllers
const dashboardController = require('../controllers/admin/dashboard.controller');
const usersController = require('../controllers/admin/users.controller');
const paymentsController = require('../controllers/admin/payments.controller');
const ratingsFlagsController = require('../controllers/admin/ratings-flags.controller');
const categoriesZonesController = require('../controllers/admin/categories-zones.controller');
const rolesController = require('../controllers/admin/roles.controller');
const settingsController = require('../controllers/admin/settings.controller');

// Import existing controllers
const c = require('../controllers/admin.controller');
const disputesController = require('../controllers/disputes.controller');

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/alerts', dashboardController.getDashboardAlerts);

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', usersController.getUsers);
router.get('/users/:id', usersController.getUser);
router.patch('/users/:id', usersController.updateUser);
router.post('/users/:id/suspend', usersController.suspendUser);
router.post('/users/:id/unsuspend', usersController.unsuspendUser);
router.post('/users/:id/verify', usersController.verifyUser);

// ─── PAYMENTS & PAYOUTS ───────────────────────────────────────────────────────
router.get('/payments', paymentsController.getPayments);
router.get('/payments/:id', paymentsController.getPayment);
router.post('/payments/:id/refund', paymentsController.refundPayment);

router.get('/payouts', paymentsController.getPayouts);
router.post('/payouts/:id/process', paymentsController.processPayout);

// ─── RATINGS & FLAGS ──────────────────────────────────────────────────────────
router.get('/ratings', ratingsFlagsController.getRatings);
router.get('/ratings/:id', ratingsFlagsController.getRating);
router.patch('/ratings/:id', ratingsFlagsController.updateRating);

router.get('/flags', ratingsFlagsController.getFlags);
router.get('/flags/:id', ratingsFlagsController.getFlag);
router.patch('/flags/:id/resolve', ratingsFlagsController.resolveFlag);

// ─── DISPUTES (keeping existing) ──────────────────────────────────────────────
router.get('/disputes', c.getDisputes);
router.post('/disputes/:id/resolve', c.resolveDispute);

// ─── CATEGORIES & SERVICE ZONES ───────────────────────────────────────────────
router.get('/categories', categoriesZonesController.getCategories);
router.post('/categories', categoriesZonesController.createCategory);
router.patch('/categories/:id', categoriesZonesController.updateCategory);
router.delete('/categories/:id', categoriesZonesController.deleteCategory);

router.get('/service-zones', categoriesZonesController.getServiceZones);
router.post('/service-zones', categoriesZonesController.createServiceZone);
router.patch('/service-zones/:id', categoriesZonesController.updateServiceZone);
router.delete('/service-zones/:id', categoriesZonesController.deleteServiceZone);

// ─── EXISTING ROUTES (keeping for backward compatibility) ─────────────────────
router.get('/reports', c.getReports);
router.put('/reports/:id', c.actionReport);

router.get('/verification/pending', c.getPendingVerifications);
router.get('/verification/documents', async (req, res) => {
  try {
    const { paginated, getPagination, buildPaginationMeta } = require('../utils/response');
    const { page, perPage, skip } = getPagination(req.query);
    const { status } = req.query;
    const allowed = ['pending', 'verified', 'rejected'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `status must be one of: ${allowed.join(', ')}` } });
    }
    const [docs, total] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: { verificationStatus: status },
        skip, take: perPage,
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      prisma.verificationDocument.count({ where: { verificationStatus: status } }),
    ]);
    return paginated(res, docs, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});
router.post('/verification/documents/:id/approve', c.approveDocument);
router.post('/verification/documents/:id/reject', c.rejectDocument);

router.get('/support/tickets', c.adminGetTickets);
router.put('/support/tickets/:id/assign', c.adminAssignTicket);
router.post('/support/tickets/:id/messages', c.adminReplyTicket);

router.post('/announcements', c.createAnnouncement);
router.put('/announcements/:id', c.updateAnnouncement);
router.delete('/announcements/:id', c.deleteAnnouncement);

router.get('/analytics/overview', c.getOverview);
router.get('/analytics/users', c.getUsersAnalytics);
router.get('/analytics/transactions', c.getTransactionsAnalytics);
router.get('/analytics/activity', c.getActivityAnalytics);

const prisma = require('../lib/prisma');

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
router.get('/audit-logs', async (req, res) => {
    const { paginated, getPagination, buildPaginationMeta } = require('../utils/response');
  
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { user_id, action, entity_type, entity_id } = req.query;
    
    const where = {};
    if (user_id) where.userId = user_id;
    if (action) where.action = { contains: action };
    if (entity_type) where.resourceType = entity_type;
    if (entity_id) where.resourceId = entity_id;
    
    const [logs, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.userActivityLog.count({ where }),
    ]);
    
    return paginated(res, logs.map(log => ({
      id: log.id,
      log_id: `LOG-${log.id.substring(0, 8)}`,
      user: log.user,
      action: log.action,
      entity_type: log.resourceType,
      entity_id: log.resourceId,
      entity_display: log.resourceType ? `${log.resourceType.toUpperCase()}-${log.resourceId?.substring(0, 8)}` : null,
      ip_address: log.ipAddress,
      created_at: log.createdAt,
    })), buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch audit logs' } });
  }
});

// ─── INLINE PRISMA FOR ADDITIONAL ADMIN ROUTES ───────────────────────────────
const {
  paginated: inlinePaginated,
  getPagination: inlineGetPagination,
  buildPaginationMeta: inlineBuildMeta,
  success: inlineSuccess,
} = require('../utils/response');
const inlinePrisma = prisma;

// ─── LOCAL REQUESTS (SERVICE REQUESTS) ───────────────────────────────────────
router.get('/local-requests', async (req, res) => {
  try {
    const { page, perPage, skip } = inlineGetPagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) where.title = { contains: req.query.q, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      inlinePrisma.serviceRequest.findMany({
        where, skip, take: perPage, orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      inlinePrisma.serviceRequest.count({ where }),
    ]);
    return inlinePaginated(res, items.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category?.name || null,
      customer: { id: r.client.id, name: `${r.client.firstName} ${r.client.lastName}` },
      budget: r.budgetMax ? Number(r.budgetMax) : null,
      status: r.status,
      city: r.city,
      urgency: r.urgency,
      created_at: r.createdAt,
    })), inlineBuildMeta(total, page, perPage));
  } catch (err) {
    console.error('Admin local-requests error:', err);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/local-requests/:id', async (req, res) => {
  try {
    const item = await inlinePrisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        category: { select: { id: true, name: true } },
        assignedProvider: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const provider = item.assignedProvider
      ? {
          id: item.assignedProvider.id,
          user_id: item.assignedProvider.userId,
          name: `${item.assignedProvider.user.firstName} ${item.assignedProvider.user.lastName}`,
          email: item.assignedProvider.user.email,
          phone: item.assignedProvider.user.phone || null,
          average_rating: item.assignedProvider.averageRating ? Number(item.assignedProvider.averageRating) : null,
          total_jobs: item.assignedProvider.totalJobsCompleted || 0,
        }
      : null;
    return inlineSuccess(res, {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category?.name || null,
      category_id: item.categoryId,
      customer: {
        id: item.client.id,
        name: `${item.client.firstName} ${item.client.lastName}`,
        email: item.client.email,
        phone: item.client.phone || null,
      },
      provider,
      budget_min: item.budgetMin ? Number(item.budgetMin) : null,
      budget_max: item.budgetMax ? Number(item.budgetMax) : null,
      status: item.status,
      address: item.address || null,
      city: item.city,
      state: item.state,
      urgency: item.urgency,
      images: item.images || [],
      attachments: item.attachments || [],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      completed_at: item.completedAt || null,
      cancelled_at: item.cancelledAt || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/local-requests/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const item = await inlinePrisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const updated = await inlinePrisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    await inlinePrisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        action: 'admin_cancel_request',
        entityType: 'ServiceRequest',
        entityId: item.id,
        metadata: { reason: reason || null, previous_status: item.status },
        ipAddress: req.ip,
      },
    }).catch(() => {});
    return inlineSuccess(res, { id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/local-requests/:id/assign-provider', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: { message: 'userId is required' } });

    const providerProfile = await inlinePrisma.providerProfile.findUnique({ where: { userId } });
    if (!providerProfile) return res.status(404).json({ success: false, error: { message: 'Provider profile not found for this user' } });

    const item = await inlinePrisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: 'Request not found' } });

    const updated = await inlinePrisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { assignedProviderId: providerProfile.id, status: 'assigned' },
      include: {
        assignedProvider: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    await inlinePrisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        action: 'admin_assign_provider',
        entityType: 'ServiceRequest',
        entityId: item.id,
        metadata: { providerId: providerProfile.id, providerUserId: userId, previous_status: item.status },
        ipAddress: req.ip,
      },
    }).catch((err) => {
      console.error('[AdminRoutes] Failed to log audit activity:', err.message);
    });
    return inlineSuccess(res, { id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/local-requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `status must be one of: ${allowed.join(', ')}` } });
    }
    const item = await inlinePrisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const updated = await inlinePrisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status },
    });
    await inlinePrisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        action: 'admin_update_request_status',
        entityType: 'ServiceRequest',
        entityId: item.id,
        metadata: { new_status: status, previous_status: item.status },
        ipAddress: req.ip,
      },
    }).catch((err) => {
      console.error('[AdminRoutes] Failed to log audit activity:', err.message);
    });
    return inlineSuccess(res, { id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── EMPLOYMENT (JOB POSTINGS) ───────────────────────────────────────────────
router.get('/employment', async (req, res) => {
  try {
    const { page, perPage, skip } = inlineGetPagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) where.title = { contains: req.query.q, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      inlinePrisma.jobPosting.findMany({
        where, skip, take: perPage, orderBy: { createdAt: 'desc' },
        include: {
          employer: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { applications: true } },
        },
      }),
      inlinePrisma.jobPosting.count({ where }),
    ]);
    return inlinePaginated(res, items.map(j => ({
      id: j.id, title: j.title,
      employer: { id: j.employer.id, name: `${j.employer.firstName} ${j.employer.lastName}` },
      category: j.category?.name || null,
      employment_type: j.employmentType,
      work_location: j.workLocation,
      salary_min: j.salaryMin ? Number(j.salaryMin) : null,
      salary_max: j.salaryMax ? Number(j.salaryMax) : null,
      applications_count: j._count.applications,
      status: j.status, city: j.city,
      created_at: j.createdAt,
    })), inlineBuildMeta(total, page, perPage));
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/employment/:id', async (req, res) => {
  try {
    const job = await inlinePrisma.jobPosting.findUnique({
      where: { id: req.params.id },
      include: {
        employer: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true } },
        applications: {
          take: 20, orderBy: { createdAt: 'desc' },
          include: { applicant: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    return inlineSuccess(res, {
      id: job.id, title: job.title, description: job.description,
      employer: { id: job.employer.id, name: `${job.employer.firstName} ${job.employer.lastName}` },
      category: job.category?.name || null,
      employment_type: job.employmentType, work_location: job.workLocation,
      salary_min: job.salaryMin ? Number(job.salaryMin) : null,
      salary_max: job.salaryMax ? Number(job.salaryMax) : null,
      status: job.status, city: job.city,
      applications_count: job._count.applications,
      applications: job.applications.map(a => ({
        id: a.id,
        applicant: { id: a.applicant.id, name: `${a.applicant.firstName} ${a.applicant.lastName}` },
        status: a.status, created_at: a.createdAt,
      })),
      created_at: job.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/employment/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'filled', 'closed', 'on_hold'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `status must be one of: ${allowed.join(', ')}` } });
    }
    const job = await inlinePrisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const updated = await inlinePrisma.jobPosting.update({ where: { id: req.params.id }, data: { status } });
    return inlineSuccess(res, { id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── PROJECTS ────────────────────────────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const { page, perPage, skip } = inlineGetPagination(req.query);
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) where.title = { contains: req.query.q, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      inlinePrisma.project.findMany({
        where, skip, take: perPage, orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { proposals: true } },
        },
      }),
      inlinePrisma.project.count({ where }),
    ]);
    return inlinePaginated(res, items.map(p => ({
      id: p.id, title: p.title,
      client: { id: p.client.id, name: `${p.client.firstName} ${p.client.lastName}` },
      category: p.category?.name || null,
      budget_min: p.budgetMin ? Number(p.budgetMin) : null,
      budget_max: p.budgetMax ? Number(p.budgetMax) : null,
      proposals_count: p._count.proposals,
      status: p.status, estimated_duration: p.estimatedDuration,
      created_at: p.createdAt,
    })), inlineBuildMeta(total, page, perPage));
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const proj = await inlinePrisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { proposals: true } },
      },
    });
    if (!proj) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    return inlineSuccess(res, {
      id: proj.id, title: proj.title, description: proj.description,
      client: { id: proj.client.id, name: `${proj.client.firstName} ${proj.client.lastName}` },
      category: proj.category?.name || null,
      budget_min: proj.budgetMin ? Number(proj.budgetMin) : null,
      budget_max: proj.budgetMax ? Number(proj.budgetMax) : null,
      status: proj.status, estimated_duration: proj.estimatedDuration,
      proposals_count: proj._count.proposals,
      start_date: proj.startDate, deadline: proj.deadline,
      created_at: proj.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/projects/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'in_progress', 'under_review', 'completed', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: { message: `status must be one of: ${allowed.join(', ')}` } });
    }
    const proj = await inlinePrisma.project.findUnique({ where: { id: req.params.id } });
    if (!proj) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const updated = await inlinePrisma.project.update({ where: { id: req.params.id }, data: { status } });
    return inlineSuccess(res, { id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── COMMUNICATIONS ──────────────────────────────────────────────────────────
router.get('/communications', async (req, res) => {
  try {
    const { page, perPage, skip } = inlineGetPagination(req.query);
    const where = {};
    if (req.query.is_blocked === 'true') where.isBlocked = true;
    const [items, total] = await Promise.all([
      inlinePrisma.conversation.findMany({
        where, skip, take: perPage, orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: { select: { id: true, firstName: true, lastName: true, email: true } },
          participant2: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      inlinePrisma.conversation.count({ where }),
    ]);
    return inlinePaginated(res, items.map(conv => ({
      id: conv.id,
      participant1: { id: conv.participant1.id, name: `${conv.participant1.firstName} ${conv.participant1.lastName}` },
      participant2: { id: conv.participant2.id, name: `${conv.participant2.firstName} ${conv.participant2.lastName}` },
      context_type: conv.contextType,
      last_message: conv.lastMessagePreview,
      last_message_at: conv.lastMessageAt,
      is_blocked: conv.isBlocked,
      created_at: conv.createdAt,
    })), inlineBuildMeta(total, page, perPage));
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/communications/:id/block', async (req, res) => {
  try {
    const conv = await inlinePrisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const updated = await inlinePrisma.conversation.update({
      where: { id: req.params.id },
      data: { isBlocked: !conv.isBlocked },
    });
    return inlineSuccess(res, { id: updated.id, is_blocked: updated.isBlocked });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/communications/:id/messages', async (req, res) => {
  try {
    const { page, perPage, skip } = inlineGetPagination(req.query);
    const messages = await inlinePrisma.message.findMany({
      where: { conversationId: req.params.id },
      skip,
      take: perPage,
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
    const total = await inlinePrisma.message.count({ where: { conversationId: req.params.id } });
    return inlinePaginated(res, messages.map(m => ({
      id: m.id,
      sender: { id: m.sender.id, firstName: m.sender.firstName, lastName: m.sender.lastName },
      content: m.content,
      message_type: m.messageType,
      created_at: m.createdAt,
    })), inlineBuildMeta(total, page, perPage));
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── ROLES & PERMISSIONS ─────────────────────────────────────────────────────
router.get('/roles/stats', rolesController.getRoleStats);
router.get('/roles/users', rolesController.getAdminUsers);
router.post('/roles/users/:userId/assign', rolesController.assignRole);
router.get('/roles', rolesController.getRoles);
router.post('/roles', rolesController.createRole);
router.patch('/roles/:id', rolesController.updateRole);

// ─── SYSTEM SETTINGS ──────────────────────────────────────────────────────────
router.get('/settings', settingsController.getSettings);
router.patch('/settings', settingsController.updateSettings);

module.exports = router;

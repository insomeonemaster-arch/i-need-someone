const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin, requirePermission } = require('../../middleware/adminAuth');

// Import admin controllers
const dashboardController = require('../controllers/admin/dashboard.controller');
const usersController = require('../controllers/admin/users.controller');
const paymentsController = require('../controllers/admin/payments.controller');
const ratingsFlagsController = require('../controllers/admin/ratings-flags.controller');
const categoriesZonesController = require('../controllers/admin/categories-zones.controller');

// Import existing controllers
const disputesController = require('../controllers/disputes.controller');
const jobsController = require('../controllers/jobs.controller');
const localServicesController = require('../controllers/localServices.controller');
const projectsController = require('../controllers/projects.controller');
const insController = require('../controllers/ins.controller');

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/dashboard/alerts', dashboardController.getDashboardAlerts);

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', requirePermission('users', 'read'), usersController.getUsers);
router.get('/users/:id', requirePermission('users', 'read'), usersController.getUser);
router.patch('/users/:id', requirePermission('users', 'write'), usersController.updateUser);
router.post('/users/:id/suspend', requirePermission('users', 'suspend'), usersController.suspendUser);
router.post('/users/:id/unsuspend', requirePermission('users', 'suspend'), usersController.unsuspendUser);
router.post('/users/:id/verify', requirePermission('users', 'write'), usersController.verifyUser);

// ─── JOBS & REQUESTS (UNIFIED VIEW) ───────────────────────────────────────────
// Local requests
router.get('/local-requests', requirePermission('requests', 'read'), localServicesController.getAdminRequests || localServicesController.getAllRequests);
router.get('/local-requests/:id', requirePermission('requests', 'read'), localServicesController.getRequestDetails || localServicesController.getRequest);
router.patch('/local-requests/:id', requirePermission('requests', 'write'), localServicesController.updateRequest);
router.post('/local-requests/:id/cancel', requirePermission('requests', 'cancel'), localServicesController.cancelRequest);

// Employment jobs
router.get('/employment', requirePermission('employment', 'read'), jobsController.getAdminJobs || jobsController.getAllJobs);
router.get('/employment/:id', requirePermission('employment', 'read'), jobsController.getJobDetails || jobsController.getJob);
router.patch('/employment/:id', requirePermission('employment', 'write'), jobsController.updateJob);
router.get('/employment/:id/applications', requirePermission('employment', 'read'), jobsController.getJobApplications);

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
router.get('/projects', requirePermission('projects', 'read'), projectsController.getAdminProjects || projectsController.getAllProjects);
router.get('/projects/:id', requirePermission('projects', 'read'), projectsController.getProjectDetails || projectsController.getProject);
router.patch('/projects/:id', requirePermission('projects', 'write'), projectsController.updateProject);
router.get('/projects/:id/proposals', requirePermission('projects', 'read'), projectsController.getProjectProposals);
router.get('/projects/:id/milestones', requirePermission('projects', 'read'), projectsController.getProjectMilestones);
router.patch('/projects/:projectId/milestones/:milestoneId', requirePermission('projects', 'write'), projectsController.updateMilestone);

// ─── PAYMENTS & PAYOUTS ───────────────────────────────────────────────────────
router.get('/payments', requirePermission('payments', 'read'), paymentsController.getPayments);
router.get('/payments/:id', requirePermission('payments', 'read'), paymentsController.getPayment);
router.post('/payments/:id/refund', requirePermission('payments', 'refund'), paymentsController.refundPayment);

router.get('/payouts', requirePermission('payments', 'read'), paymentsController.getPayouts);
router.post('/payouts/:id/process', requirePermission('payments', 'process'), paymentsController.processPayout);

// ─── RATINGS & FLAGS ──────────────────────────────────────────────────────────
router.get('/ratings', requirePermission('ratings', 'read'), ratingsFlagsController.getRatings);
router.get('/ratings/:id', requirePermission('ratings', 'read'), ratingsFlagsController.getRating);
router.patch('/ratings/:id', requirePermission('ratings', ['hide', 'remove']), ratingsFlagsController.updateRating);

router.get('/flags', requirePermission('flags', 'read'), ratingsFlagsController.getFlags);
router.get('/flags/:id', requirePermission('flags', 'read'), ratingsFlagsController.getFlag);
router.patch('/flags/:id/resolve', requirePermission('flags', 'resolve'), ratingsFlagsController.resolveFlag);

// ─── DISPUTES ─────────────────────────────────────────────────────────────────
router.get('/disputes', requirePermission('disputes', 'read'), disputesController.getAdminDisputes || disputesController.getDisputes);
router.get('/disputes/:id', requirePermission('disputes', 'read'), disputesController.getDisputeDetails || disputesController.getDispute);
router.patch('/disputes/:id/assign', requirePermission('disputes', 'assign'), disputesController.assignDispute);
router.patch('/disputes/:id/resolve', requirePermission('disputes', 'resolve'), disputesController.resolveDispute);

// ─── COMMUNICATIONS (CHAT TRANSCRIPTS) ────────────────────────────────────────
router.get('/communications', requirePermission('messages', 'read'), async (req, res) => {
  // Get all conversations
    const { paginated, getPagination, buildPaginationMeta } = require('../../utils/response');
  const prisma = require('../lib/prisma');
  
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { entity_type, participant_id } = req.query;
    
    const where = {};
    if (entity_type) where.contextType = entity_type;
    // Note: participant filtering would need custom logic
    
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);
    
    return paginated(res, conversations.map(c => ({
      id: c.id,
      thread_id: `THREAD-${c.id.substring(0, 8)}`,
      entity_type: c.contextType,
      entity_id: c.contextId,
      entity_display: c.contextType ? `${c.contextType.toUpperCase()}-${c.contextId?.substring(0, 8)}` : null,
      participants: [c.participant1, c.participant2],
      message_count: c.messages.length,
      last_message: c.messages[0] ? {
        content: c.messages[0].content,
        sender: c.messages[0].senderId === c.participant1.id ? `${c.participant1.firstName} ${c.participant1.lastName}` : `${c.participant2.firstName} ${c.participant2.lastName}`,
        timestamp: c.messages[0].createdAt,
      } : null,
      created_at: c.createdAt,
    })), buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get communications error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch communications' } });
  }
});

router.get('/communications/:threadId/messages', requirePermission('messages', 'read'), async (req, res) => {
    const { paginated, getPagination, buildPaginationMeta } = require('../../utils/response');
  const prisma = require('../lib/prisma');
  
  try {
    const { page, perPage, skip } = getPagination(req.query);
    
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: req.params.threadId },
        skip,
        take: perPage,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      prisma.message.count({ where: { conversationId: req.params.threadId } }),
    ]);
    
    return paginated(res, messages.map(m => ({
      id: m.id,
      message_id: `MSG-${m.id.substring(0, 8)}`,
      sender: m.sender,
      content: m.content,
      message_type: m.messageType,
      is_system: false,
      created_at: m.createdAt,
    })), buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch messages' } });
  }
});

router.post('/ins/chat', requirePermission('settings', 'read'), insController.adminChat || insController.chat);

// ─── CATEGORIES & SERVICE ZONES ───────────────────────────────────────────────
router.get('/categories', requirePermission('categories', 'read'), categoriesZonesController.getCategories);
router.post('/categories', requirePermission('categories', 'write'), categoriesZonesController.createCategory);
router.patch('/categories/:id', requirePermission('categories', 'write'), categoriesZonesController.updateCategory);
router.delete('/categories/:id', requirePermission('categories', 'delete'), categoriesZonesController.deleteCategory);

router.get('/service-zones', requirePermission('zones', 'read'), categoriesZonesController.getServiceZones);
router.post('/service-zones', requirePermission('zones', 'write'), categoriesZonesController.createServiceZone);
router.patch('/service-zones/:id', requirePermission('zones', 'write'), categoriesZonesController.updateServiceZone);
router.delete('/service-zones/:id', requirePermission('zones', 'delete'), categoriesZonesController.deleteServiceZone);

// ─── ROLES & PERMISSIONS ──────────────────────────────────────────────────────
// TODO: Implement roles management (A12 from spec)

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
router.get('/audit-logs', requirePermission('audit_logs', 'read'), async (req, res) => {
    const { paginated, getPagination, buildPaginationMeta } = require('../../utils/response');
  const prisma = require('../lib/prisma');
  
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

router.get('/audit-logs/:id', requirePermission('audit_logs', 'read'), async (req, res) => {
    const { success, error } = require('../../utils/response');
  const prisma = require('../lib/prisma');
  
  try {
    const log = await prisma.userActivityLog.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    
    if (!log) {
      return error(res, 'Audit log not found', 404, 'NOT_FOUND');
    }
    
    return success(res, log);
  } catch (err) {
    console.error('Get audit log error:', err);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch audit log' } });
  }
});

// ─── SYSTEM SETTINGS ──────────────────────────────────────────────────────────
// TODO: Implement system settings management (A14 from spec)

// ─── BULK ACTIONS ─────────────────────────────────────────────────────────────
// TODO: Implement bulk actions (A15 from spec)

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
// TODO: Implement data exports (A16 from spec)

module.exports = router;

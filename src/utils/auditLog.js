const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Log admin activity to audit log
 * @param {Object} params
 * @param {string} params.userId - Admin user ID
 * @param {string} params.action - Action performed (e.g., 'user.suspended', 'payment.refunded')
 * @param {string} params.resourceType - Type of resource (e.g., 'user', 'payment', 'dispute')
 * @param {string} params.resourceId - ID of the resource
 * @param {Object} params.changes - Before/after changes
 * @param {string} params.ipAddress - IP address of admin
 * @param {string} params.userAgent - User agent string
 * @param {Object} params.metadata - Additional metadata
 */
const logAdminAction = async ({
  userId,
  action,
  resourceType = null,
  resourceId = null,
  changes = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  try {
    await prisma.userActivityLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        deviceType: metadata?.deviceType || null,
      },
    });

    // Log to console for debugging
    console.log(`[AUDIT] ${action} by ${userId} on ${resourceType}:${resourceId}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure should not break the main operation
  }
};

/**
 * Express middleware to automatically log admin actions
 * Captures request details and logs after response
 */
const auditMiddleware = (action, options = {}) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function (data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceType = options.resourceType || req.params.entity || null;
        const resourceId = options.resourceId || req.params.id || null;
        
        logAdminAction({
          userId: req.user?.id,
          action: action || `${req.method.toLowerCase()}.${req.baseUrl}${req.path}`,
          resourceType,
          resourceId,
          changes: options.captureBody ? req.body : null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
          },
        }).catch((err) => console.error('Audit log error:', err));
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Helper to create detailed change log for updates
 */
const createChangeLog = (before, after) => {
  const changes = {};
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  
  for (const key of allKeys) {
    if (before[key] !== after[key]) {
      changes[key] = {
        from: before[key],
        to: after[key],
      };
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : null;
};

/**
 * Common admin actions for consistent logging
 */
const AdminActions = {
  // User actions
  USER_CREATED: 'admin.user.created',
  USER_UPDATED: 'admin.user.updated',
  USER_SUSPENDED: 'admin.user.suspended',
  USER_UNSUSPENDED: 'admin.user.unsuspended',
  USER_VERIFIED: 'admin.user.verified',
  USER_DELETED: 'admin.user.deleted',
  
  // Payment actions
  PAYMENT_REFUNDED: 'admin.payment.refunded',
  PAYMENT_PROCESSED: 'admin.payment.processed',
  PAYOUT_PROCESSED: 'admin.payout.processed',
  
  // Dispute actions
  DISPUTE_ASSIGNED: 'admin.dispute.assigned',
  DISPUTE_RESOLVED: 'admin.dispute.resolved',
  DISPUTE_UPDATED: 'admin.dispute.updated',
  
  // Flag actions
  FLAG_REVIEWED: 'admin.flag.reviewed',
  FLAG_RESOLVED: 'admin.flag.resolved',
  
  // Rating actions
  RATING_HIDDEN: 'admin.rating.hidden',
  RATING_REMOVED: 'admin.rating.removed',
  RATING_APPROVED: 'admin.rating.approved',
  
  // Request actions
  REQUEST_CANCELLED: 'admin.request.cancelled',
  REQUEST_UPDATED: 'admin.request.updated',
  
  // Project actions
  PROJECT_CANCELLED: 'admin.project.cancelled',
  PROJECT_UPDATED: 'admin.project.updated',
  MILESTONE_APPROVED: 'admin.milestone.approved',
  
  // Job actions
  JOB_CLOSED: 'admin.job.closed',
  JOB_UPDATED: 'admin.job.updated',
  
  // Category actions
  CATEGORY_CREATED: 'admin.category.created',
  CATEGORY_UPDATED: 'admin.category.updated',
  CATEGORY_DELETED: 'admin.category.deleted',
  
  // Service Zone actions
  ZONE_CREATED: 'admin.zone.created',
  ZONE_UPDATED: 'admin.zone.updated',
  ZONE_DELETED: 'admin.zone.deleted',
  
  // Role actions
  ROLE_CREATED: 'admin.role.created',
  ROLE_UPDATED: 'admin.role.updated',
  ROLE_DELETED: 'admin.role.deleted',
  ROLE_ASSIGNED: 'admin.role.assigned',
  ROLE_UNASSIGNED: 'admin.role.unassigned',
  
  // Settings actions
  SETTINGS_UPDATED: 'admin.settings.updated',
  
  // Bulk actions
  BULK_USER_UPDATE: 'admin.bulk.users.updated',
  BULK_REQUEST_CANCEL: 'admin.bulk.requests.cancelled',
  BULK_PAYOUT_PROCESS: 'admin.bulk.payouts.processed',
  
  // Export actions
  DATA_EXPORTED: 'admin.data.exported',
};

module.exports = {
  logAdminAction,
  auditMiddleware,
  createChangeLog,
  AdminActions,
};

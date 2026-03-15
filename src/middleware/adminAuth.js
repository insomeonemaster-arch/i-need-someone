const { error } = require('../utils/response');

const prisma = require('../lib/prisma');

/**
 * Middleware to check if user has admin access
 */
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return error(res, 'Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
  }
  next();
};

/**
 * Middleware to check specific admin permissions
 * @param {string} resource - The resource to check (e.g., 'users', 'payments', 'disputes')
 * @param {string|string[]} actions - The action(s) to check (e.g., 'read', 'write', 'delete')
 */
const requirePermission = (resource, actions) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.isAdmin) {
        return error(res, 'Admin access required', 403, 'ADMIN_ACCESS_REQUIRED');
      }

      // Super admins bypass permission checks
      if (req.user.email === process.env.SUPER_ADMIN_EMAIL) {
        return next();
      }

      // Get user's admin roles and permissions
      const userRoles = await prisma.adminUserRole.findMany({
        where: { userId: req.user.id },
        include: {
          role: true,
        },
      });

      if (!userRoles.length) {
        return error(res, 'Insufficient permissions', 403, 'PERMISSION_DENIED');
      }

      // Check if user has required permissions
      const actionsArray = Array.isArray(actions) ? actions : [actions];
      const hasPermission = userRoles.some((userRole) => {
        const permissions = userRole.role.permissions;
        if (!permissions || !permissions[resource]) return false;
        
        const resourcePermissions = permissions[resource];
        return actionsArray.every((action) => resourcePermissions.includes(action));
      });

      if (!hasPermission) {
        return error(
          res,
          `Insufficient permissions for ${resource}:${actionsArray.join(',')}`,
          403,
          'PERMISSION_DENIED'
        );
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      return error(res, 'Permission check failed', 500, 'INTERNAL_ERROR');
    }
  };
};

/**
 * Load user permissions into request object
 */
const loadAdminPermissions = async (req, res, next) => {
  try {
    if (!req.user?.isAdmin) {
      return next();
    }

    // Super admins have all permissions
    if (req.user.email === process.env.SUPER_ADMIN_EMAIL) {
      req.adminPermissions = {
        isSuperAdmin: true,
        roles: ['super_admin'],
        permissions: 'all',
      };
      return next();
    }

    const userRoles = await prisma.adminUserRole.findMany({
      where: { userId: req.user.id },
      include: {
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    req.adminPermissions = {
      isSuperAdmin: false,
      roles: userRoles.map((ur) => ur.role.name),
      permissions: userRoles.reduce((acc, ur) => {
        return { ...acc, ...ur.role.permissions };
      }, {}),
    };

    next();
  } catch (err) {
    console.error('Load admin permissions error:', err);
    next();
  }
};

/**
 * Helper to check if user can perform action in code
 */
const canPerform = (req, resource, action) => {
  if (!req.adminPermissions) return false;
  if (req.adminPermissions.isSuperAdmin) return true;
  if (req.adminPermissions.permissions === 'all') return true;
  
  const resourcePerms = req.adminPermissions.permissions[resource];
  if (!resourcePerms) return false;
  
  return resourcePerms.includes(action);
};

module.exports = {
  requireAdmin,
  requirePermission,
  loadAdminPermissions,
  canPerform,
};

const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');

const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return error(res, 'Authentication required', 401, 'AUTH_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub, isActive: true, deletedAt: null },
      select: {
        id: true,
        email: true,
        currentMode: true,
        isAdmin: true,
        isProvider: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      return error(res, 'User not found', 401, 'AUTH_INVALID');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Token expired', 401, 'AUTH_EXPIRED');
    }
    return error(res, 'Invalid token', 401, 'AUTH_INVALID');
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return error(res, 'Access denied', 403, 'FORBIDDEN');
  }
  next();
};

const requireProvider = (req, res, next) => {
  if (!req.user?.isProvider) {
    return error(res, 'Provider account required', 403, 'FORBIDDEN');
  }
  next();
};

const requireMode = (mode) => (req, res, next) => {
  if (req.user?.currentMode !== mode) {
    return error(res, `Switch to ${mode} mode to perform this action`, 403, 'FORBIDDEN');
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProvider, requireMode };

const prisma = require('../lib/prisma');

const log = (action) => async (req, res, next) => {
  if (req.user?.id) {
    prisma.userActivityLog.create({
      data: {
        userId: req.user.id,
        action,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceType: /mobile/i.test(req.headers['user-agent']) ? 'mobile' : 'desktop',
      },
    }).catch((err) => {
      console.error('[ActivityLogger] Failed to log activity:', err.message);
    });
  }
  next();
};

module.exports = { log };

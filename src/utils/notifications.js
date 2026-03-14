const { notifyQueue } = require('../lib/queues');

/**
 * Queue a notification for a user.
 * The notify worker handles DB insert + email/sms/push dispatch.
 */
const send = async ({ userId, type, title, body, actionUrl = null, contextType = null, contextId = null, io = null }) => {
  // Real-time socket emit (immediate)
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', { type, title, body, actionUrl });
  }

  // Queue async delivery (email + sms + push)
  await notifyQueue.add('send', { userId, type, title, body, actionUrl, contextType, contextId });
};

module.exports = { send };

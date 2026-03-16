const app = require('./app');
const config = require('./config');
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: { origin: config.frontendUrl, credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const { verifyAccessToken } = require('./utils/jwt');
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.sub;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
  io.emit('user:online', { userId: socket.userId });

  socket.on('conversation:join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('message:send', async ({ conversationId, content, type = 'text' }) => {
    io.to(`conversation:${conversationId}`).emit('message:new', {
      conversationId, senderId: socket.userId, content, type,
      createdAt: new Date().toISOString(),
    });

    // Queue email notification for recipient
    const { notifyQueue } = require('./lib/queues');
        const prisma = require('./lib/prisma');
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: { select: { id: true } },
        participant2: { select: { id: true } },
      },
    });
    if (conversation) {
      const recipientId = conversation.participant1Id === socket.userId
        ? conversation.participant2Id
        : conversation.participant1Id;

      await notifyQueue.add('send', {
        userId: recipientId,
        type: 'message',
        title: 'New message',
        body: content.substring(0, 100),
        actionUrl: `/messages/${conversationId}`,
        contextType: 'message',
        contextId: conversationId,
      });
    }
  });

  socket.on('message:typing', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('message:typing', {
      conversationId, userId: socket.userId,
    });
  });

  socket.on('disconnect', () => {
    io.emit('user:offline', { userId: socket.userId });
  });
});

// Expose io for use in controllers/jobs
app.set('io', io);

// ── Bull Board (admin queue dashboard) ────────────────────────────────────────

if (config.env !== 'production' || process.env.ENABLE_QUEUE_DASHBOARD === 'true') {
  const queueDashboard = require('./lib/queues/dashboard');
  app.use('/admin/queues', queueDashboard.getRouter());
  console.log(`Queue dashboard: http://localhost:${config.port}/admin/queues`);
}

// ── Start workers ─────────────────────────────────────────────────────────────

require('./lib/queues/workers/email.worker');
require('./lib/queues/workers/sms.worker');
require('./lib/queues/workers/push.worker');
require('./lib/queues/workers/image.worker');
require('./lib/queues/workers/payout.worker');
require('./lib/queues/workers/notify.worker');
require('./lib/queues/workers/cleanup.worker');
require('./lib/queues/workers/analytics.worker');

// ── Scheduler ─────────────────────────────────────────────────────────────────

const { schedule } = require('./lib/queues/scheduler');
schedule().then(() => console.log('[Scheduler] Ready'));

// ── Payout recovery (re-queue any pending payouts stuck from a prior crash/restart)
(async () => {
  try {
    const prisma = require('./lib/prisma');
    const { payoutQueue } = require('./lib/queues');
    const stuck = await prisma.payout.findMany({ where: { status: 'pending' } });
    if (stuck.length > 0) {
      console.log(`[PayoutRecovery] Re-queuing ${stuck.length} pending payout(s)...`);
      for (const p of stuck) {
        await payoutQueue.add('process', { payoutId: p.id });
      }
    }
  } catch (err) {
    console.error('[PayoutRecovery] Error:', err.message);
  }
})();

// ── Listen ────────────────────────────────────────────────────────────────────

server.listen(config.port, () => {
  console.log(`🚀 INS API running on port ${config.port} [${config.env}]`);
});

module.exports = { server, io };

const { cleanupQueue } = require('../index');

const prisma = require('../../prisma');

// Remove expired sessions
cleanupQueue.process('sessions', async () => {
  const result = await prisma.userSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  console.log(`[Cleanup] Deleted ${result.count} expired sessions`);
});

// Remove old activity logs (keep 90 days)
cleanupQueue.process('activity-logs', async () => {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await prisma.userActivityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  console.log(`[Cleanup] Deleted ${result.count} old activity logs`);
});

// Mark expired job postings as closed
cleanupQueue.process('expire-jobs', async () => {
  const result = await prisma.jobPosting.updateMany({
    where: { status: 'open', expiresAt: { lt: new Date() } },
    data: { status: 'closed', closedAt: new Date() },
  });
  console.log(`[Cleanup] Expired ${result.count} job postings`);
});

// Mark abandoned INS conversations
cleanupQueue.process('ins-conversations', async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h inactive
  const result = await prisma.insConversation.updateMany({
    where: { status: 'active', lastInteractionAt: { lt: cutoff } },
    data: { status: 'abandoned' },
  });
  console.log(`[Cleanup] Marked ${result.count} INS conversations as abandoned`);
});

// Deactivate expired announcements
cleanupQueue.process('announcements', async () => {
  const result = await prisma.announcement.updateMany({
    where: { isActive: true, expireAt: { lt: new Date() } },
    data: { isActive: false },
  });
  console.log(`[Cleanup] Deactivated ${result.count} expired announcements`);
});

cleanupQueue.on('failed', (job, err) => {
  console.error(`[CleanupQueue] Job ${job.id} (${job.name}) failed:`, err.message);
});

console.log('[Worker] Cleanup queue started');

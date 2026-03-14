const { cleanupQueue, analyticsQueue, payoutQueue } = require('./index');

const schedule = async () => {
  // ── Daily jobs ─────────────────────────────────────────────
  await cleanupQueue.add('sessions',         {}, { repeat: { cron: '0 2 * * *' } });   // 2am daily
  await cleanupQueue.add('activity-logs',    {}, { repeat: { cron: '0 3 * * *' } });   // 3am daily
  await cleanupQueue.add('expire-jobs',      {}, { repeat: { cron: '0 0 * * *' } });   // midnight
  await cleanupQueue.add('ins-conversations',{}, { repeat: { cron: '0 4 * * *' } });   // 4am daily
  await cleanupQueue.add('announcements',    {}, { repeat: { cron: '0 1 * * *' } });   // 1am daily

  await analyticsQueue.add('daily-snapshot', {}, { repeat: { cron: '55 23 * * *' } }); // 11:55pm daily

  console.log('[Scheduler] Recurring jobs registered');
};

module.exports = { schedule };

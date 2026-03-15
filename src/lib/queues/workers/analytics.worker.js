const { analyticsQueue } = require('../index');

const prisma = require('../../prisma');

// Recalculate provider rating/stats after a review
analyticsQueue.process('update-provider-stats', async (job) => {
  const { providerId } = job.data;

  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
  if (!provider) return;

  const [ratingData, completedJobs, earnings] = await Promise.all([
    prisma.review.aggregate({
      where: { revieweeId: provider.userId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.serviceRequest.count({
      where: { assignedProviderId: providerId, status: 'completed' },
    }),
    prisma.transaction.aggregate({
      where: { payeeId: provider.userId, status: 'completed' },
      _sum: { providerEarnings: true },
    }),
  ]);

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      averageRating: ratingData._avg.rating || 0,
      totalReviews: ratingData._count,
      totalJobsCompleted: completedJobs,
      totalEarnings: earnings._sum.providerEarnings || 0,
    },
  });

  console.log(`[Analytics] Updated stats for provider ${providerId}`);
});

// Daily platform stats snapshot (could write to a stats table or external analytics)
analyticsQueue.process('daily-snapshot', async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [newUsers, newRequests, newJobs, newProjects, completedTransactions] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.serviceRequest.count({ where: { createdAt: { gte: today } } }),
    prisma.jobPosting.count({ where: { createdAt: { gte: today } } }),
    prisma.project.count({ where: { createdAt: { gte: today } } }),
    prisma.transaction.count({ where: { status: 'completed', completedAt: { gte: today } } }),
  ]);

  console.log('[Analytics] Daily snapshot:', { newUsers, newRequests, newJobs, newProjects, completedTransactions });
  // TODO: push to Mixpanel / your analytics table
});

analyticsQueue.on('failed', (job, err) => {
  console.error(`[AnalyticsQueue] Job ${job.id} (${job.name}) failed:`, err.message);
});

console.log('[Worker] Analytics queue started');
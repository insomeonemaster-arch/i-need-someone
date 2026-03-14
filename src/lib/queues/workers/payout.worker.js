const { payoutQueue } = require('../index');
const stripe = require('../../stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

payoutQueue.process('process', async (job) => {
  const { payoutId } = job.data;

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: { provider: true },
  });

  if (!payout) throw new Error(`Payout ${payoutId} not found`);
  if (payout.status !== 'pending') {
    console.log(`[PayoutQueue] Payout ${payoutId} already processed, skipping`);
    return;
  }

  await prisma.payout.update({ where: { id: payoutId }, data: { status: 'processing' } });

  try {
    const provider = await prisma.providerProfile.findUnique({ where: { id: payout.providerId } });
    if (!provider?.stripeConnectId) throw new Error('Provider has no Stripe Connect account');

    // Create a Stripe payout to connected account
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(payout.amount) * 100),
      currency: payout.currency?.toLowerCase() || 'usd',
      destination: provider.stripeConnectId,
      metadata: { payoutId: payout.id, providerId: payout.providerId },
    });

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        payoutProvider: 'stripe',
        payoutProviderId: transfer.id,
        processedAt: new Date(),
        completedAt: new Date(),
      },
    });

    console.log(`[PayoutQueue] Payout ${payoutId} completed: ${transfer.id}`);
  } catch (err) {
    await prisma.payout.update({ where: { id: payoutId }, data: { status: 'failed', statusDetails: err.message } });
    throw err;
  }
});

payoutQueue.on('failed', (job, err) => {
  console.error(`[PayoutQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] Payout queue started');

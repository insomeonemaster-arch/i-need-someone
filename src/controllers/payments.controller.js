const stripe = require('../lib/stripe');
const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');
const { payoutQueue, notifyQueue } = require('../lib/queues');

const prisma = new PrismaClient();

const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId: req.user.id },
      orderBy: { isDefault: 'desc' },
    });
    return success(res, methods);
  } catch (err) {
    next(err);
  }
};

const addPaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      // Note: add stripeCustomerId to User model in schema
    }

    const pm = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    const isFirst = (await prisma.paymentMethod.count({ where: { userId: req.user.id } })) === 0;

    const method = await prisma.paymentMethod.create({
      data: {
        userId: req.user.id,
        type: pm.type,
        provider: 'stripe',
        providerPaymentMethodId: pm.id,
        lastFour: pm.card?.last4,
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: isFirst,
        isVerified: true,
      },
    });
    return success(res, method, 201);
  } catch (err) {
    next(err);
  }
};

const setDefaultMethod = async (req, res, next) => {
  try {
    await prisma.paymentMethod.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    await prisma.paymentMethod.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isDefault: true } });
    return success(res, { message: 'Default payment method updated' });
  } catch (err) {
    next(err);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    const method = await prisma.paymentMethod.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!method) return error(res, 'Payment method not found', 404, 'NOT_FOUND');

    if (method.providerPaymentMethodId) {
      await stripe.paymentMethods.detach(method.providerPaymentMethodId);
    }
    await prisma.paymentMethod.delete({ where: { id: req.params.id } });
    return success(res, { message: 'Payment method removed' });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const where = { OR: [{ payerId: req.user.id }, { payeeId: req.user.id }] };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      prisma.transaction.count({ where }),
    ]);
    return paginated(res, transactions, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');

    const earnings = await prisma.transaction.aggregate({
      where: { payeeId: req.user.id, status: 'completed' },
      _sum: { providerEarnings: true },
      _count: true,
    });

    const pending = await prisma.transaction.aggregate({
      where: { payeeId: req.user.id, status: 'pending' },
      _sum: { providerEarnings: true },
    });

    return success(res, {
      totalEarnings: earnings._sum.providerEarnings || 0,
      completedJobs: earnings._count,
      pendingEarnings: pending._sum.providerEarnings || 0,
    });
  } catch (err) {
    next(err);
  }
};

const requestPayout = async (req, res, next) => {
  try {
    const { amount, payoutMethod } = req.body;
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');

    const payout = await prisma.payout.create({
      data: { providerId: providerProfile.id, amount, payoutMethod: payoutMethod || 'bank_transfer', status: 'pending' },
    });
    await payoutQueue.add('process', { payoutId: payout.id }, { delay: 5000 }); // 5s delay
    return success(res, payout, 201);
  } catch (err) {
    next(err);
  }
};

// Stripe webhook handler
const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return error(res, 'Webhook signature verification failed', 400, 'VALIDATION_ERROR');
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await prisma.transaction.updateMany({
        where: { paymentProviderTransactionId: event.data.object.id },
        data: { status: 'completed', completedAt: new Date() },
      });
      break;
    case 'payment_intent.payment_failed':
      await prisma.transaction.updateMany({
        where: { paymentProviderTransactionId: event.data.object.id },
        data: { status: 'failed' },
      });
      break;
  }

  res.json({ received: true });
};


const createConnectAccount = async (req, res, next) => {
  try {
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile required', 403, 'FORBIDDEN');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: { transfers: { requested: true } },
      business_type: 'individual',
      metadata: { userId: user.id, providerId: providerProfile.id },
    });

    // Store connect account ID — add stripeConnectId to ProviderProfile schema
    await prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data: { stripeConnectId: account.id },
    });

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/provider/payments/connect/refresh`,
      return_url: `${process.env.FRONTEND_URL}/provider/payments/connect/success`,
      type: 'account_onboarding',
    });

    return success(res, { url: accountLink.url });
  } catch (err) {
    next(err);
  }
};

const getConnectStatus = async (req, res, next) => {
  try {
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile?.stripeConnectId) {
      return success(res, { connected: false });
    }
    const account = await stripe.accounts.retrieve(providerProfile.stripeConnectId);
    return success(res, {
      connected: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (err) {
    next(err);
  }
};

const chargePayment = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', contextType, contextId, payeeId, paymentMethodId } = req.body;

    const PLATFORM_FEE_PERCENT = 0.10; // 10%
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT);

    const payee = await prisma.user.findUnique({ where: { id: payeeId } });
    const payeeProvider = await prisma.providerProfile.findUnique({ where: { userId: payeeId } });
    if (!payeeProvider?.stripeConnectId) return error(res, 'Provider not connected to Stripe', 400, 'VALIDATION_ERROR');

    const payer = await prisma.user.findUnique({ where: { id: req.user.id } });
    let customerId = payer.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: payer.email, metadata: { userId: payer.id } });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      application_fee_amount: platformFee * 100,
      transfer_data: { destination: payeeProvider.stripeConnectId },
      metadata: { contextType, contextId, payerId: req.user.id, payeeId },
    });

    const transaction = await prisma.transaction.create({
      data: {
        payerId: req.user.id,
        payeeId,
        contextType,
        contextId,
        amount,
        currency: currency.toUpperCase(),
        platformFee: PLATFORM_FEE_PERCENT * amount,
        providerEarnings: amount - PLATFORM_FEE_PERCENT * amount,
        paymentMethod: 'credit_card',
        paymentProvider: 'stripe',
        paymentProviderTransactionId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing',
      },
    });

    await notifyQueue.add('send', {
        userId: payeeId,
        type: 'payment',
        title: 'Payment received',
        body: `You received a payment of $${amount}`,
        contextType,
        contextId,
    });

    return success(res, transaction, 201);
  } catch (err) {
    next(err);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, OR: [{ payerId: req.user.id }, { payeeId: req.user.id }] },
    });
    if (!transaction) return error(res, 'Transaction not found', 404, 'NOT_FOUND');
    return success(res, transaction);
  } catch (err) {
    next(err);
  }
};

const refundTransaction = async (req, res, next) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: req.params.id, payerId: req.user.id, status: 'completed' },
    });
    if (!transaction) return error(res, 'Transaction not found or not refundable', 404, 'NOT_FOUND');

    const refund = await stripe.refunds.create({
      payment_intent: transaction.paymentProviderTransactionId,
      reason: 'requested_by_customer',
    });

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'refunded', refundedAt: new Date() },
    });

    return success(res, { message: 'Refund initiated', refundId: refund.id });
  } catch (err) {
    next(err);
  }
};

const getPayouts = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({ where: { providerId: providerProfile.id }, skip, take: perPage, orderBy: { requestedAt: 'desc' } }),
      prisma.payout.count({ where: { providerId: providerProfile.id } }),
    ]);
    return paginated(res, payouts, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getEarningsSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const [allTime, thisMonth, thisWeek, pending] = await Promise.all([
      prisma.transaction.aggregate({ where: { payeeId: req.user.id, status: 'completed' }, _sum: { providerEarnings: true }, _count: true }),
      prisma.transaction.aggregate({ where: { payeeId: req.user.id, status: 'completed', completedAt: { gte: startOfMonth } }, _sum: { providerEarnings: true } }),
      prisma.transaction.aggregate({ where: { payeeId: req.user.id, status: 'completed', completedAt: { gte: startOfWeek } }, _sum: { providerEarnings: true } }),
      prisma.transaction.aggregate({ where: { payeeId: req.user.id, status: 'pending' }, _sum: { providerEarnings: true } }),
    ]);

    return success(res, {
      allTime: { earnings: allTime._sum.providerEarnings || 0, jobs: allTime._count },
      thisMonth: { earnings: thisMonth._sum.providerEarnings || 0 },
      thisWeek: { earnings: thisWeek._sum.providerEarnings || 0 },
      pending: { earnings: pending._sum.providerEarnings || 0 },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPaymentMethods, addPaymentMethod, setDefaultMethod, deletePaymentMethod, getTransactions, getEarnings, requestPayout, handleWebhook, createConnectAccount, getConnectStatus, chargePayment, getTransaction, refundTransaction, getPayouts, getEarningsSummary };

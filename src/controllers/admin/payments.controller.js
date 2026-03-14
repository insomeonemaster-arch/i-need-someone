const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../../utils/response');
const { logAdminAction, AdminActions } = require('../../utils/auditLog');
const stripe = require('../../lib/stripe');

const prisma = new PrismaClient();

/**
 * GET /api/admin/payments
 * List all payments
 */
const getPayments = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status, entity_type, amount_min, amount_max } = req.query;

    const where = {};
    if (status) where.status = status;
    if (entity_type) where.entityType = entity_type;
    if (amount_min) where.amount = { gte: parseFloat(amount_min) };
    if (amount_max) {
      where.amount = { ...where.amount, lte: parseFloat(amount_max) };
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          payer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          payee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // Get entity display names
    const paymentsWithDetails = await Promise.all(
      payments.map(async (payment) => {
        let entityDisplay = payment.paymentId;

        // Fetch entity details based on type
        if (payment.entityType === 'local_request') {
          const request = await prisma.serviceRequest.findUnique({
            where: { id: payment.entityId },
            select: { title: true },
          });
          entityDisplay = request ? `REQ-${payment.entityId.substring(0, 8)}: ${request.title}` : entityDisplay;
        } else if (payment.entityType === 'project') {
          const project = await prisma.project.findUnique({
            where: { id: payment.entityId },
            select: { title: true },
          });
          entityDisplay = project ? `PRJ-${payment.entityId.substring(0, 8)}: ${project.title}` : entityDisplay;
        } else if (payment.entityType === 'milestone') {
          const milestone = await prisma.milestone.findUnique({
            where: { id: payment.entityId },
            select: { title: true },
          });
          entityDisplay = milestone ? `MS-${payment.entityId.substring(0, 8)}: ${milestone.title}` : entityDisplay;
        }

        return {
          id: payment.id,
          payment_id: payment.paymentId,
          payer: {
            id: payment.payer.id,
            name: `${payment.payer.firstName} ${payment.payer.lastName}`,
          },
          payee: payment.payee
            ? {
                id: payment.payee.id,
                name: `${payment.payee.firstName} ${payment.payee.lastName}`,
              }
            : null,
          entity_type: payment.entityType,
          entity_id: payment.entityId,
          entity_display: entityDisplay,
          amount: Number(payment.amount),
          fee: Number(payment.fee),
          net_amount: Number(payment.netAmount),
          status: payment.status,
          payment_method: payment.paymentMethod,
          created_at: payment.createdAt,
          completed_at: payment.completedAt,
        };
      })
    );

    return paginated(res, paymentsWithDetails, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    console.error('Get payments error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/payments/:id
 * Get detailed payment information
 */
const getPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        payer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        payee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return error(res, 'Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    return success(res, {
      id: payment.id,
      payment_id: payment.paymentId,
      payer: payment.payer,
      payee: payment.payee,
      entity_type: payment.entityType,
      entity_id: payment.entityId,
      amount: Number(payment.amount),
      fee: Number(payment.fee),
      net_amount: Number(payment.netAmount),
      currency: payment.currency,
      payment_method: payment.paymentMethod,
      status: payment.status,
      stripe_payment_intent_id: payment.stripePaymentIntentId,
      stripe_transfer_id: payment.stripeTransferId,
      held_until: payment.heldUntil,
      completed_at: payment.completedAt,
      refunded_at: payment.refundedAt,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
    });
  } catch (err) {
    console.error('Get payment error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/payments/:id/refund
 * Process a refund
 */
const refundPayment = async (req, res, next) => {
  try {
    const { amount, reason, notes } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
    });

    if (!payment) {
      return error(res, 'Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'completed') {
      return error(res, 'Can only refund completed payments', 400, 'INVALID_STATUS');
    }

    const refundAmount = amount || Number(payment.amount);

    // Process refund via Stripe
    if (payment.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: 'requested_by_customer',
        });
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        return error(res, 'Failed to process refund with payment provider', 500, 'REFUND_FAILED');
      }
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'refunded',
        refundedAt: new Date(),
      },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.PAYMENT_REFUNDED,
      resourceType: 'payment',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { amount: refundAmount, reason, notes },
    });

    return success(res, {
      message: 'Refund processed successfully',
      refund_amount: refundAmount,
    });
  } catch (err) {
    console.error('Refund payment error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/payouts
 * List all payouts
 */
const getPayouts = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { status, provider_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (provider_id) where.providerId = provider_id;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
    ]);

    return paginated(
      res,
      payouts.map((payout) => ({
        id: payout.id,
        payout_id: payout.payoutId,
        provider: {
          id: payout.provider.id,
          name: `${payout.provider.firstName} ${payout.provider.lastName}`,
        },
        amount: Number(payout.amount),
        status: payout.status,
        method: payout.method,
        initiated_at: payout.initiatedAt,
        completed_at: payout.completedAt,
        created_at: payout.createdAt,
      })),
      buildPaginationMeta(total, page, perPage)
    );
  } catch (err) {
    console.error('Get payouts error:', err);
    next(err);
  }
};

/**
 * POST /api/admin/payouts/:id/process
 * Manually process a payout
 */
const processPayout = async (req, res, next) => {
  try {
    const { admin_notes } = req.body;

    const payout = await prisma.payout.findUnique({
      where: { id: req.params.id },
      include: {
        provider: {
          select: {
            stripeCustomerId: true,
          },
        },
      },
    });

    if (!payout) {
      return error(res, 'Payout not found', 404, 'PAYOUT_NOT_FOUND');
    }

    if (payout.status !== 'pending') {
      return error(res, 'Payout already processed', 400, 'INVALID_STATUS');
    }

    // Process payout via Stripe (if configured)
    let stripePayoutId = null;
    if (payout.provider.stripeCustomerId) {
      try {
        const stripePayout = await stripe.payouts.create(
          {
            amount: Math.round(Number(payout.amount) * 100),
            currency: payout.currency.toLowerCase(),
          },
          {
            stripeAccount: payout.provider.stripeCustomerId,
          }
        );
        stripePayoutId = stripePayout.id;
      } catch (stripeError) {
        console.error('Stripe payout error:', stripeError);
        // Continue even if Stripe fails - admin can process manually
      }
    }

    // Update payout
    await prisma.payout.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        stripePayoutId,
        completedAt: new Date(),
      },
    });

    await logAdminAction({
      userId: req.user.id,
      action: AdminActions.PAYOUT_PROCESSED,
      resourceType: 'payout',
      resourceId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { admin_notes },
    });

    return success(res, {
      message: 'Payout processed successfully',
    });
  } catch (err) {
    console.error('Process payout error:', err);
    next(err);
  }
};

module.exports = {
  getPayments,
  getPayment,
  refundPayment,
  getPayouts,
  processPayout,
};

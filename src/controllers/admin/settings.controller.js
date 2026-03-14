const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../../utils/response');

const prisma = new PrismaClient();

// Default values are used when no DB row exists for a key.
const DEFAULTS = {
  platform_name: 'I Need Someone',
  support_email: 'support@ineedsomeone.com',
  support_phone: '',
  default_currency: 'USD',
  time_zone: 'America/New_York',
  feature_local_requests: true,
  feature_employment_posts: true,
  feature_projects: true,
  feature_ins_assistant: true,
  feature_beta: false,
  feature_auto_match: true,
  feature_notifications: true,
  feature_ratings: true,
  payment_gateway: 'Stripe',
  payment_authorize_on_acceptance: true,
  payout_schedule: 'weekly',
  refund_timeout_hours: 24,
  search_radius_default_km: 10,
  search_radius_max_km: 50,
};

const getSettings = async (req, res, next) => {
  try {
    const rows = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    const result = { ...DEFAULTS };
    for (const row of rows) result[row.key] = row.value;
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return error(res, 'Request body must be a key-value object', 400, 'VALIDATION_ERROR');
    }
    const allowed = new Set(Object.keys(DEFAULTS));
    const entries = Object.entries(body).filter(([k]) => allowed.has(k));
    if (!entries.length) {
      return error(res, 'No valid settings provided', 400, 'VALIDATION_ERROR');
    }
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value, updatedBy: req.user.id },
          create: { key, value, updatedBy: req.user.id },
        })
      )
    );
    return success(res, { message: 'Settings saved' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };

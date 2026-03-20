const Bull = require('bull');

// DigitalOcean Valkey (and other managed Redis) use rediss:// (TLS).
// Bull passes this to ioredis which needs explicit TLS opts — a bare URL string won't do it.
function getRedisOpts() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { host: '127.0.0.1', port: 6379 };

  const parsed = new URL(redisUrl);
  const opts = {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10),
    ...(parsed.password && { password: decodeURIComponent(parsed.password) }),
    ...(parsed.username && parsed.username !== 'default' && { username: decodeURIComponent(parsed.username) }),
    maxRetriesPerRequest: null, // required by Bull — don't let ioredis throw on queue ops
    enableReadyCheck: false,
  };

  if (parsed.protocol === 'rediss:') {
    opts.tls = { rejectUnauthorized: false };
  }

  return opts;
}

const defaultOpts = {
  redis: getRedisOpts(),
  defaultJobOptions: {
    removeOnComplete: 100, // keep last 100 completed jobs
    removeOnFail: 200,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
};

const emailQueue      = new Bull('email',       defaultOpts);
const smsQueue        = new Bull('sms',         defaultOpts);
const pushQueue       = new Bull('push',        defaultOpts);
const imageQueue      = new Bull('image',       defaultOpts);
const payoutQueue     = new Bull('payout',      defaultOpts);
const notifyQueue     = new Bull('notify',      defaultOpts);
const cleanupQueue    = new Bull('cleanup',     defaultOpts);
const analyticsQueue  = new Bull('analytics',   defaultOpts);

module.exports = {
  emailQueue,
  smsQueue,
  pushQueue,
  imageQueue,
  payoutQueue,
  notifyQueue,
  cleanupQueue,
  analyticsQueue,
};

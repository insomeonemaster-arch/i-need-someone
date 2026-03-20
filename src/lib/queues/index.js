const Bull = require('bull');

const defaultOpts = {
  redis: process.env.REDIS_URL,
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

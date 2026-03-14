const { createBullBoard } = require('@bull-board/api');
const { BullAdapter }    = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const {
  emailQueue, smsQueue, pushQueue, imageQueue,
  payoutQueue, notifyQueue, cleanupQueue, analyticsQueue,
} = require('./index');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(smsQueue),
    new BullAdapter(pushQueue),
    new BullAdapter(imageQueue),
    new BullAdapter(payoutQueue),
    new BullAdapter(notifyQueue),
    new BullAdapter(cleanupQueue),
    new BullAdapter(analyticsQueue),
  ],
  serverAdapter,
});

module.exports = serverAdapter;

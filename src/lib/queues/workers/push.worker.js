const { pushQueue } = require('../index');
// Uncomment and install firebase-admin when ready:
// const admin = require('firebase-admin');
// admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

pushQueue.process('send', async (job) => {
  const { userId, title, body, actionUrl, notificationId } = job.data;

  // TODO: fetch user's FCM/APNS tokens from your device_tokens table
  // const tokens = await prisma.deviceToken.findMany({ where: { userId, isActive: true } });

  // if (!tokens.length) return;

  // const message = {
  //   notification: { title, body },
  //   data: { actionUrl: actionUrl || '', notificationId },
  //   tokens: tokens.map(t => t.token),
  // };
  // const response = await admin.messaging().sendEachForMulticast(message);
  // Handle failed tokens, remove stale ones, etc.

  console.log(`[PushQueue] Push for user ${userId}: ${title}`);
});

pushQueue.on('failed', (job, err) => {
  console.error(`[PushQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] Push queue started');

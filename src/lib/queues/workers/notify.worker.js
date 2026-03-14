const { notifyQueue } = require('../index');
const { emailQueue, smsQueue, pushQueue } = require('../index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

notifyQueue.process('send', async (job) => {
  const { userId, type, title, body, actionUrl, contextType, contextId } = job.data;

  // Create DB notification
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, actionUrl, contextType, contextId },
  });

  // Get user settings
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true, firstName: true } }),
    prisma.notificationSettings.findUnique({ where: { userId } }),
  ]);

  if (!user) return;

  const typeMap = {
    message:  { email: settings?.emailMessages, sms: settings?.smsMessages, push: settings?.pushMessages },
    booking:  { email: settings?.emailBookings, sms: settings?.smsBookings,  push: settings?.pushBookings  },
    payment:  { email: settings?.emailPayments, sms: settings?.smsPayments,  push: settings?.pushPayments  },
    review:   { email: settings?.emailReviews,  sms: false,                   push: settings?.pushReviews   },
    system:   { email: settings?.emailSystem,   sms: false,                   push: settings?.pushSystem    },
  };

  const prefs = typeMap[type] || { email: true, sms: false, push: true };

  // Queue email
  if (prefs.email !== false && user.email) {
    await emailQueue.add('send', {
      to: user.email,
      subject: title,
      html: `<h3>${title}</h3><p>${body}</p>${actionUrl ? `<a href="${actionUrl}">View</a>` : ''}`,
    }, { delay: 2000 }); // slight delay so real-time arrives first
  }

  // Queue SMS for high-priority types
  if (prefs.sms && user.phone && ['booking', 'payment'].includes(type)) {
    await smsQueue.add('send', { to: user.phone, body: `${title}: ${body}` });
  }

  // Queue push (placeholder — integrate FCM here)
  if (prefs.push !== false) {
    await pushQueue.add('send', { userId, title, body, actionUrl, notificationId: notification.id });
  }

  // Mark delivery flags
  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      isEmailSent: prefs.email !== false,
      isSmsSent: !!(prefs.sms && user.phone),
    },
  });
});

notifyQueue.on('failed', (job, err) => {
  console.error(`[NotifyQueue] Job ${job.id} failed:`, err.message);
});

console.log('[Worker] Notify queue started');

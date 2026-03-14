const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = new PrismaClient();

const getNotifications = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
    ]);
    return paginated(res, notifications, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true, readAt: new Date() },
    });
    return success(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    return success(res, { message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.notificationSettings.findUnique({ where: { userId: req.user.id } });
    if (!settings) {
      settings = await prisma.notificationSettings.create({ data: { userId: req.user.id } });
    }
    
    const response = {
      push: {
        types: [
          ...(settings.pushMessages ? ['messages'] : []),
          ...(settings.pushBookings ? ['bookings'] : []),
          ...(settings.pushPayments ? ['payments'] : []),
          ...(settings.pushReviews ? ['reviews'] : []),
          ...(settings.pushSystem ? ['system'] : []),
        ],
      },
      email: {
        types: [
          ...(settings.emailMessages ? ['messages'] : []),
          ...(settings.emailBookings ? ['bookings'] : []),
          ...(settings.emailPayments ? ['payments'] : []),
          ...(settings.emailReviews ? ['reviews'] : []),
          ...(settings.emailSystem ? ['system'] : []),
          ...(settings.emailMarketing ? ['marketing'] : []),
        ],
      },
      sms: {
        types: [
          ...(settings.smsMessages ? ['messages'] : []),
          ...(settings.smsBookings ? ['bookings'] : []),
          ...(settings.smsPayments ? ['payments'] : []),
        ],
      },
    };
    
    return success(res, response);
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { push, email, sms } = req.body;
    
    const updateData = {};
    const createData = { userId: req.user.id };
    
    if (push && push.types) {
      updateData.pushMessages = push.types.includes('messages');
      updateData.pushBookings = push.types.includes('bookings');
      updateData.pushPayments = push.types.includes('payments');
      updateData.pushReviews = push.types.includes('reviews');
      updateData.pushSystem = push.types.includes('system');
      
      createData.pushMessages = push.types.includes('messages');
      createData.pushBookings = push.types.includes('bookings');
      createData.pushPayments = push.types.includes('payments');
      createData.pushReviews = push.types.includes('reviews');
      createData.pushSystem = push.types.includes('system');
    }
    
    if (email && email.types) {
      updateData.emailMessages = email.types.includes('messages');
      updateData.emailBookings = email.types.includes('bookings');
      updateData.emailPayments = email.types.includes('payments');
      updateData.emailReviews = email.types.includes('reviews');
      updateData.emailSystem = email.types.includes('system');
      updateData.emailMarketing = email.types.includes('marketing');
      
      createData.emailMessages = email.types.includes('messages');
      createData.emailBookings = email.types.includes('bookings');
      createData.emailPayments = email.types.includes('payments');
      createData.emailReviews = email.types.includes('reviews');
      createData.emailSystem = email.types.includes('system');
      createData.emailMarketing = email.types.includes('marketing');
    }

    if (sms && sms.types) {
      updateData.smsMessages = sms.types.includes('messages');
      updateData.smsBookings = sms.types.includes('bookings');
      updateData.smsPayments = sms.types.includes('payments');
      
      createData.smsMessages = sms.types.includes('messages');
      createData.smsBookings = sms.types.includes('bookings');
      createData.smsPayments = sms.types.includes('payments');
    }

    const settings = await prisma.notificationSettings.upsert({
      where: { userId: req.user.id },
      update: updateData,
      create: createData,
    });
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        publishAt: { lte: now },
        AND: [
          { OR: [{ expireAt: null }, { expireAt: { gt: now } }] },
          { OR: [{ targetAudience: 'all' }, { targetAudience: req.user.currentMode === 'provider' ? 'providers' : 'clients' }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
      take: 20,
    });
    return success(res, announcements);
  } catch (err) {
    next(err);
  }
};

const getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { id: req.params.id, isActive: true },
    });
    if (!announcement) return error(res, 'Announcement not found', 404, 'NOT_FOUND');
    return success(res, announcement);
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount, getSettings, updateSettings, getAnnouncements, getAnnouncement };

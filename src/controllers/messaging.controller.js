const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = require('../lib/prisma');

// Ensures consistent ordering so we don't get duplicate conversations
const sortParticipants = (id1, id2) =>
  id1 < id2 ? [id1, id2] : [id2, id1];

const getConversations = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const userId = req.user.id;

    const where = {
      OR: [{ participant1Id: userId }, { participant2Id: userId }],
      isBlocked: false,
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where, skip, take: perPage,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: {
            select: {
              messages: {
                where: { senderId: { not: userId }, isRead: false },
              },
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    // Flatten _count.messages → unreadCount
    const normalized = conversations.map((c) => ({
      ...c,
      unreadCount: c._count?.messages ?? 0,
      _count: undefined,
    }));

    return paginated(res, normalized, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const createConversation = async (req, res, next) => {
  try {
    const { recipientId, contextType, contextId } = req.body;
    if (!recipientId) return error(res, 'Recipient required', 400, 'VALIDATION_ERROR');

    const [p1, p2] = sortParticipants(req.user.id, recipientId);

    const existing = await prisma.conversation.findFirst({
      where: { participant1Id: p1, participant2Id: p2, contextType: contextType || null, contextId: contextId || null },
    });
    if (existing) return success(res, existing);

    const conversation = await prisma.conversation.create({
      data: { participant1Id: p1, participant2Id: p2, contextType, contextId },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    return success(res, conversation, 201);
  } catch (err) {
    next(err);
  }
};

const getConversation = async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        participant1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        participant2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');

    const isParticipant = [conversation.participant1Id, conversation.participant2Id].includes(req.user.id);
    if (!isParticipant) return error(res, 'Access denied', 403, 'FORBIDDEN');

    return success(res, conversation);
  } catch (err) {
    next(err);
  }
};

const archiveConversation = async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');

    const isP1 = conversation.participant1Id === req.user.id;
    const isP2 = conversation.participant2Id === req.user.id;
    if (!isP1 && !isP2) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const data = isP1 ? { isArchivedByP1: true } : { isArchivedByP2: true };
    const updated = await prisma.conversation.update({ where: { id: req.params.id }, data });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');
    const isParticipant = [conversation.participant1Id, conversation.participant2Id].includes(req.user.id);
    if (!isParticipant) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const { page, perPage, skip } = getPagination(req.query);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: req.params.id, isDeletedBySender: false, isDeletedByRecipient: false },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
      }),
      prisma.message.count({ where: { conversationId: req.params.id } }),
    ]);

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: { conversationId: req.params.id, senderId: { not: req.user.id }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return paginated(res, messages.reverse(), buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content, messageType = 'text', attachments } = req.body;
    if (!content) return error(res, 'Message content required', 400, 'VALIDATION_ERROR');

    const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) return error(res, 'Conversation not found', 404, 'NOT_FOUND');
    if (conversation.isBlocked) return error(res, 'Conversation is blocked', 403, 'FORBIDDEN');

    const isParticipant = [conversation.participant1Id, conversation.participant2Id].includes(req.user.id);
    if (!isParticipant) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const message = await prisma.message.create({
      data: {
        conversationId: req.params.id,
        senderId: req.user.id,
        content,
        messageType,
        attachments,
      },
      include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
    });

    await prisma.conversation.update({
      where: { id: req.params.id },
      data: { lastMessageAt: new Date(), lastMessagePreview: content.substring(0, 100) },
    });

    return success(res, message, 201);
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) return error(res, 'Message not found', 404, 'NOT_FOUND');

    if (message.senderId === req.user.id) {
      await prisma.message.update({ where: { id: req.params.id }, data: { isDeletedBySender: true } });
    } else {
      await prisma.message.update({ where: { id: req.params.id }, data: { isDeletedByRecipient: true } });
    }
    return success(res, { message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ participant1Id: req.user.id }, { participant2Id: req.user.id }],
        },
        senderId: { not: req.user.id },
        isRead: false,
      },
    });
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, createConversation, getConversation, archiveConversation, getMessages, sendMessage, deleteMessage, getUnreadCount };

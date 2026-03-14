const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = new PrismaClient();

const getTickets = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId: req.user.id },
        skip, take: perPage, orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count({ where: { userId: req.user.id } }),
    ]);
    return paginated(res, tickets, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const createTicket = async (req, res, next) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description || !category) return error(res, 'Missing required fields', 400, 'VALIDATION_ERROR');

    const ticket = await prisma.supportTicket.create({
      data: { userId: req.user.id, subject, description, category, priority: priority || 'normal' },
    });
    return success(res, ticket, 201);
  } catch (err) {
    next(err);
  }
};

const getTicket = async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return error(res, 'Ticket not found', 404, 'NOT_FOUND');
    return success(res, ticket);
  } catch (err) {
    next(err);
  }
};

const closeTicket = async (req, res, next) => {
  try {
    await prisma.supportTicket.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'closed', closedAt: new Date() },
    });
    return success(res, { message: 'Ticket closed' });
  } catch (err) {
    next(err);
  }
};

const getTicketMessages = async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!ticket) return error(res, 'Ticket not found', 404, 'NOT_FOUND');

    const messages = await prisma.supportTicketMessage.findMany({
      where: { ticketId: req.params.id, isInternalNote: false },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, messages);
  } catch (err) {
    next(err);
  }
};

const addTicketMessage = async (req, res, next) => {
  try {
    const ticket = await prisma.supportTicket.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!ticket) return error(res, 'Ticket not found', 404, 'NOT_FOUND');
    if (['closed', 'resolved'].includes(ticket.status)) return error(res, 'Ticket is closed', 400, 'VALIDATION_ERROR');

    const message = await prisma.supportTicketMessage.create({
      data: { ticketId: req.params.id, senderId: req.user.id, message: req.body.message },
    });
    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: 'in-progress', updatedAt: new Date() },
    });
    return success(res, message, 201);
  } catch (err) {
    next(err);
  }
};

const getFaqs = async (req, res, next) => {
  try {
    const { category } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;

    const faqs = await prisma.faq.findMany({ where, orderBy: { displayOrder: 'asc' } });
    return success(res, faqs);
  } catch (err) {
    next(err);
  }
};

const getFaq = async (req, res, next) => {
  try {
    const faq = await prisma.faq.findFirst({ where: { id: req.params.id, isActive: true } });
    if (!faq) return error(res, 'FAQ not found', 404, 'NOT_FOUND');
    return success(res, faq);
  } catch (err) {
    next(err);
  }
};

module.exports = { getTickets, createTicket, getTicket, closeTicket, getTicketMessages, addTicketMessage, getFaqs, getFaq };
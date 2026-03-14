const { PrismaClient } = require('@prisma/client');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = new PrismaClient();

const createDispute = async (req, res, next) => {
  try {
    const { filedAgainstUserId, contextType, contextId, transactionId, reason, description, evidence } = req.body;

    const dispute = await prisma.dispute.create({
      data: {
        filedByUserId: req.user.id,
        filedAgainstUserId,
        contextType, contextId, transactionId,
        reason, description, evidence: evidence || [],
      },
    });
    return success(res, dispute, 201);
  } catch (err) {
    next(err);
  }
};

const getDisputes = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const where = { OR: [{ filedByUserId: req.user.id }, { filedAgainstUserId: req.user.id }] };

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' } }),
      prisma.dispute.count({ where }),
    ]);
    return paginated(res, disputes, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getDispute = async (req, res, next) => {
  try {
    const dispute = await prisma.dispute.findFirst({
      where: { id: req.params.id, OR: [{ filedByUserId: req.user.id }, { filedAgainstUserId: req.user.id }] },
    });
    if (!dispute) return error(res, 'Dispute not found', 404, 'NOT_FOUND');
    return success(res, dispute);
  } catch (err) {
    next(err);
  }
};

const addEvidence = async (req, res, next) => {
  try {
    const dispute = await prisma.dispute.findFirst({
      where: { id: req.params.id, filedByUserId: req.user.id, status: { in: ['open', 'under_review'] } },
    });
    if (!dispute) return error(res, 'Dispute not found', 404, 'NOT_FOUND');

    const currentEvidence = Array.isArray(dispute.evidence) ? dispute.evidence : [];
    const updated = await prisma.dispute.update({
      where: { id: req.params.id },
      data: { evidence: [...currentEvidence, ...req.body.evidence] },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const createReport = async (req, res, next) => {
  try {
    const { reportedEntityType, reportedEntityId, reportedUserId, reason, description } = req.body;
    const report = await prisma.report.create({
      data: { reporterId: req.user.id, reportedEntityType, reportedEntityId, reportedUserId, reason, description },
    });
    return success(res, report, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { createDispute, getDisputes, getDispute, addEvidence, createReport };

const { success, error } = require('../utils/response');

const prisma = require('../lib/prisma');

const getStatus = async (req, res, next) => {
  try {
    const [documents, backgroundChecks] = await Promise.all([
      prisma.verificationDocument.findMany({ where: { userId: req.user.id } }),
      prisma.backgroundCheck.findMany({ where: { userId: req.user.id } }),
    ]);

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      select: { verificationStatus: true, verificationLevel: true },
    });

    return success(res, { documents, backgroundChecks, providerVerification: providerProfile });
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const { documentType, documentNumber, issuingAuthority, issueDate, expiryDate, fileUrl, fileType } = req.body;

    const doc = await prisma.verificationDocument.create({
      data: {
        userId: req.user.id,
        documentType, documentNumber, issuingAuthority,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        fileUrl, fileType,
      },
    });
    return success(res, doc, 201);
  } catch (err) {
    next(err);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const docs = await prisma.verificationDocument.findMany({ where: { userId: req.user.id } });
    return success(res, docs);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await prisma.verificationDocument.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!doc) return error(res, 'Document not found', 404, 'NOT_FOUND');
    if (doc.verificationStatus === 'verified') return error(res, 'Cannot delete a verified document', 400, 'VALIDATION_ERROR');

    await prisma.verificationDocument.delete({ where: { id: req.params.id } });
    return success(res, { message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};

const requestBackgroundCheck = async (req, res, next) => {
  try {
    const { checkType } = req.body;
    const check = await prisma.backgroundCheck.create({
      data: { userId: req.user.id, checkType, checkProvider: 'Checkr', status: 'pending' },
    });
    // TODO: Trigger Checkr API call here
    return success(res, check, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getStatus, uploadDocument, getDocuments, deleteDocument, requestBackgroundCheck };

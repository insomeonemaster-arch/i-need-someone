const { z } = require('zod');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');
const { notifyQueue } = require('../lib/queues');

const prisma = require('../lib/prisma');

const createProjectSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  projectScope: z.enum(['small', 'medium', 'large']).optional(),
  estimatedDuration: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  budgetType: z.enum(['fixed', 'hourly', 'milestone-based']).optional(),
  requiredSkills: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  deadline: z.string().optional(),
});

const createProposalSchema = z.object({
  coverLetter: z.string().min(10),
  proposedPrice: z.number().positive(),
  pricingType: z.enum(['fixed', 'hourly', 'milestone-based']).optional(),
  estimatedHours: z.number().optional(),
  estimatedDuration: z.string().optional(),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    amount: z.number(),
    dueDate: z.string().optional(),
  })).optional(),
});

const getMyProjects = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { clientId: req.user.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { category: true, _count: { select: { proposals: true } } },
      }),
      prisma.project.count({ where: { clientId: req.user.id } }),
    ]);
    return paginated(res, projects, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: { ...data, clientId: req.user.id },
      include: { category: true },
    });
    return success(res, project, 201);
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        assignedProvider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        milestones: { orderBy: { order: 'asc' } },
        _count: { select: { proposals: true } },
      },
    });
    if (!project) return error(res, 'Project not found', 404, 'NOT_FOUND');

    // Access control: only client or assigned provider may view full details
    const isClient = project.client?.id === req.user.id;
    const isAssigned = project.assignedProvider?.user?.id === req.user.id;
    if (!isClient && !isAssigned) {
      return error(res, 'Access denied', 403, 'FORBIDDEN');
    }

    return success(res, project);
  } catch (err) {
    next(err);
  }
};

const submitProposal = async (req, res, next) => {
  try {
    const data = createProposalSchema.parse(req.body);
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile required', 403, 'FORBIDDEN');

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return error(res, 'Project not found', 404, 'NOT_FOUND');
    if (project.status !== 'open') return error(res, 'Project is no longer accepting proposals', 400, 'VALIDATION_ERROR');
    if (project.clientId === req.user.id) return error(res, 'Cannot propose on your own project', 400, 'VALIDATION_ERROR');

    const existing = await prisma.projectProposal.findUnique({
      where: { projectId_providerId: { projectId: req.params.id, providerId: providerProfile.id } },
    });
    if (existing) return error(res, 'Already submitted a proposal', 409, 'CONFLICT');

    const { milestones, ...proposalData } = data;
    const proposal = await prisma.projectProposal.create({
      data: { ...proposalData, projectId: req.params.id, providerId: providerProfile.id, milestones: milestones || [] },
    });
    await notifyQueue.add('send', {
        userId: project.clientId,
        type: 'booking',
        title: 'New project proposal',
        body: `You received a proposal on: ${project.title}`,
        contextType: 'project',
        contextId: project.id,
    });

    return success(res, proposal, 201);
  } catch (err) {
    next(err);
  }
};

const acceptProposal = async (req, res, next) => {
  try {
    const proposal = await prisma.projectProposal.findUnique({
      where: { id: req.params.id },
      include: { project: true, provider: { include: { user: true } } },
    });
    if (!proposal) return error(res, 'Proposal not found', 404, 'NOT_FOUND');
    if (proposal.project.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');
    if (proposal.status !== 'pending') return error(res, 'Proposal is no longer pending', 400, 'VALIDATION_ERROR');

    // If milestones are in the proposal, create them in the milestones table
    const milestoneData = Array.isArray(proposal.milestones) ? proposal.milestones : [];

    await prisma.$transaction([
      prisma.projectProposal.update({
        where: { id: req.params.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
      prisma.projectProposal.updateMany({
        where: { projectId: proposal.projectId, id: { not: req.params.id } },
        data: { status: 'rejected', rejectedAt: new Date() },
      }),
      prisma.project.update({
        where: { id: proposal.projectId },
        data: { status: 'in_progress', assignedProviderId: proposal.providerId, startedAt: new Date() },
      }),
      ...milestoneData.map((m, i) => prisma.milestone.create({
        data: {
          projectId: proposal.projectId,
          title: m.title || m.name,
          description: m.description,
          amount: m.amount || m.price,
          dueDate: m.dueDate ? new Date(m.dueDate) : null,
          order: i,
        },
      })),
    ]);

    await notifyQueue.add('send', {
        userId: proposal.provider.userId,
        type: 'booking',
        title: 'Your proposal was accepted!',
        body: `Your proposal for "${proposal.project.title}" was accepted. The project has started.`,
        contextType: 'project',
        contextId: proposal.projectId,
    });

    return success(res, { message: 'Proposal accepted, project started' });
  } catch (err) {
    next(err);
  }
};

const browseProjects = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { categoryId, budgetType, scope, keyword } = req.query;

    const where = { status: 'open' };
    if (categoryId) where.categoryId = categoryId;
    if (budgetType) where.budgetType = budgetType;
    if (scope) where.projectScope = scope;
    if (keyword) where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { description: { contains: keyword, mode: 'insensitive' } },
    ];

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          client: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { proposals: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return paginated(res, projects, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

// ── Added missing handlers ────────────────────────────────────────────────────

const getMyProposals = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!providerProfile) return error(res, 'Provider profile required', 403, 'FORBIDDEN');

    const [proposals, total] = await Promise.all([
      prisma.projectProposal.findMany({
        where: { providerId: providerProfile.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { project: { include: { category: true, client: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.projectProposal.count({ where: { providerId: providerProfile.id } }),
    ]);
    return paginated(res, proposals, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const rejectProposal = async (req, res, next) => {
  try {
    const proposal = await prisma.projectProposal.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!proposal) return error(res, 'Proposal not found', 404, 'NOT_FOUND');
    if (proposal.project.clientId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');
    if (proposal.status !== 'pending') return error(res, 'Proposal is no longer pending', 400, 'VALIDATION_ERROR');

    const updated = await prisma.projectProposal.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectedAt: new Date() },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProjects, createProject, getProject, submitProposal, acceptProposal, rejectProposal, getMyProposals, browseProjects };

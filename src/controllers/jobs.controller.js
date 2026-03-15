const { z } = require('zod');
const { success, paginated, error, getPagination, buildPaginationMeta } = require('../utils/response');
const { notifyQueue } = require('../lib/queues');

const prisma = require('../lib/prisma');

const createJobSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary']),
  workLocation: z.enum(['on_site', 'remote', 'hybrid']),
  city: z.string().optional(),
  state: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryType: z.enum(['hourly', 'monthly', 'yearly']).optional(),
  requiredSkills: z.array(z.string()).optional(),
  minExperienceYears: z.number().int().optional(),
  applicationDeadline: z.string().optional(),
  positionsAvailable: z.number().int().default(1),
  companyName: z.string().optional(),
});

const applySchema = z.object({
  coverLetter: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  expectedSalary: z.number().optional(),
  availableFrom: z.string().optional(),
});

// ── Job Postings ──────────────────────────────────────────────────────────────

const getMyPostings = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where: { employerId: req.user.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { category: true, _count: { select: { applications: true } } },
      }),
      prisma.jobPosting.count({ where: { employerId: req.user.id } }),
    ]);
    return paginated(res, jobs, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const createJob = async (req, res, next) => {
  try {
    const data = createJobSchema.parse(req.body);
    const job = await prisma.jobPosting.create({
      data: { ...data, employerId: req.user.id },
      include: { category: true },
    });
    return success(res, job, 201);
  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        employer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
    return success(res, job);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
    if (job.employerId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const updated = await prisma.jobPosting.update({ where: { id: req.params.id }, data: req.body });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const closeJob = async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
    if (job.employerId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const updated = await prisma.jobPosting.update({
      where: { id: req.params.id },
      data: { status: 'closed', closedAt: new Date() },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

// ── Applications ──────────────────────────────────────────────────────────────

const applyToJob = async (req, res, next) => {
  try {
    const data = applySchema.parse(req.body);
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
    if (job.status !== 'open') return error(res, 'Job is no longer accepting applications', 400, 'VALIDATION_ERROR');
    if (job.employerId === req.user.id) return error(res, 'Cannot apply to your own job', 400, 'VALIDATION_ERROR');

    const existing = await prisma.jobApplication.findUnique({
      where: { jobPostingId_applicantId: { jobPostingId: req.params.id, applicantId: req.user.id } },
    });
    if (existing) return error(res, 'Already applied to this job', 409, 'CONFLICT');

    const application = await prisma.jobApplication.create({
      data: { ...data, jobPostingId: req.params.id, applicantId: req.user.id },
    });
    await notifyQueue.add('send', {
        userId: job.employerId,
        type: 'booking',
        title: 'New job application',
        body: `Someone applied to your job: ${job.title}`,
        contextType: 'job',
        contextId: job.id,
    });
    return success(res, application, 201);
  } catch (err) {
    next(err);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { applicantId: req.user.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { jobPosting: { include: { category: true, employer: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.jobApplication.count({ where: { applicantId: req.user.id } }),
    ]);
    return paginated(res, applications, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getJobApplications = async (req, res, next) => {
  try {
    const job = await prisma.jobPosting.findUnique({ where: { id: req.params.id } });
    if (!job) return error(res, 'Job not found', 404, 'NOT_FOUND');
    if (job.employerId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const { page, perPage, skip } = getPagination(req.query);
    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where: { jobPostingId: req.params.id },
        skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { applicant: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, city: true } } },
      }),
      prisma.jobApplication.count({ where: { jobPostingId: req.params.id } }),
    ]);
    return paginated(res, applications, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'];
    if (!validStatuses.includes(status)) return error(res, 'Invalid status', 400, 'VALIDATION_ERROR');

    const application = await prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: { jobPosting: true },
    });
    if (!application) return error(res, 'Application not found', 404, 'NOT_FOUND');
    if (application.jobPosting.employerId !== req.user.id) return error(res, 'Access denied', 403, 'FORBIDDEN');

    const updated = await prisma.jobApplication.update({
      where: { id: req.params.id },
      data: { status, reviewedAt: new Date() },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const browseJobs = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { categoryId, category, employmentType, workLocation, minSalary, maxSalary, keyword, q } = req.query;

    const where = { status: 'open' };
    // Accept both 'categoryId' and 'category' param names
    const catId = categoryId || category;
    if (catId) where.categoryId = catId;
    if (employmentType) where.employmentType = employmentType;
    if (workLocation) where.workLocation = workLocation;
    // Accept both 'keyword' and 'q' param names
    const searchTerm = keyword || q;
    if (searchTerm) where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
    ];

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where, skip, take: perPage,
        orderBy: { createdAt: 'desc' },
        include: { category: true, employer: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      }),
      prisma.jobPosting.count({ where }),
    ]);
    return paginated(res, jobs, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyPostings, createJob, getJob, updateJob, closeJob, applyToJob, getMyApplications, getJobApplications, updateApplicationStatus, browseJobs };

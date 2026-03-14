const { PrismaClient } = require('@prisma/client');
const { success, paginated, getPagination, buildPaginationMeta } = require('../utils/response');

const prisma = new PrismaClient();

const globalSearch = async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || q.length < 2) return success(res, { providers: [], jobs: [], projects: [] });

    const keyword = { contains: q, mode: 'insensitive' };

    const [providers, jobs, projects] = await Promise.all([
      type && type !== 'providers' ? [] : prisma.providerProfile.findMany({
        where: { verificationStatus: 'verified', OR: [{ title: keyword }, { tagline: keyword }] },
        take: 5,
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      }),
      type && type !== 'jobs' ? [] : prisma.jobPosting.findMany({
        where: { status: 'open', OR: [{ title: keyword }, { description: keyword }] },
        take: 5,
        include: { category: true },
      }),
      type && type !== 'projects' ? [] : prisma.project.findMany({
        where: { status: 'open', OR: [{ title: keyword }, { description: keyword }] },
        take: 5,
        include: { category: true },
      }),
    ]);

    return success(res, { providers, jobs, projects });
  } catch (err) {
    next(err);
  }
};

const searchProviders = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { q, categoryId, minRating, maxRate } = req.query;

    const where = { verificationStatus: 'verified', isAvailable: true };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { tagline: { contains: q, mode: 'insensitive' } }];
    if (minRating) where.averageRating = { gte: parseFloat(minRating) };
    if (maxRate) where.hourlyRate = { lte: parseFloat(maxRate) };

    const [providers, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where, skip, take: perPage,
        orderBy: { averageRating: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, city: true } } },
      }),
      prisma.providerProfile.count({ where }),
    ]);
    return paginated(res, providers, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const { module: mod } = req.params;
    const where = { isActive: true };
    if (mod) where.module = mod;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: { children: { where: { isActive: true } } },
    });
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const getSkills = async (req, res, next) => {
  try {
    const { q, categoryId } = req.query;
    const where = {};
    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;

    const skills = await prisma.skill.findMany({ where, orderBy: { usageCount: 'desc' }, take: 50 });
    return success(res, skills);
  } catch (err) {
    next(err);
  }
};

const searchJobs = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { q, categoryId, employmentType, workLocation, city } = req.query;
    const where = { status: 'open' };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = categoryId;
    if (employmentType) where.employmentType = employmentType;
    if (workLocation) where.workLocation = workLocation;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { category: true } }),
      prisma.jobPosting.count({ where }),
    ]);
    return paginated(res, jobs, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const searchProjects = async (req, res, next) => {
  try {
    const { page, perPage, skip } = getPagination(req.query);
    const { q, categoryId, budgetType, scope } = req.query;
    const where = { status: 'open' };
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = categoryId;
    if (budgetType) where.budgetType = budgetType;
    if (scope) where.projectScope = scope;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, skip, take: perPage, orderBy: { createdAt: 'desc' }, include: { category: true } }),
      prisma.project.count({ where }),
    ]);
    return paginated(res, projects, buildPaginationMeta(total, page, perPage));
  } catch (err) {
    next(err);
  }
};

const autocomplete = async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;
    if (!q || q.length < 2) return success(res, []);

    const keyword = { contains: q, mode: 'insensitive' };
    const results = [];

    if (type === 'all' || type === 'skills') {
      const skills = await prisma.skill.findMany({ where: { name: keyword }, take: 5, select: { id: true, name: true, slug: true } });
      results.push(...skills.map(s => ({ type: 'skill', ...s })));
    }
    if (type === 'all' || type === 'categories') {
      const cats = await prisma.category.findMany({ where: { name: keyword, isActive: true }, take: 5, select: { id: true, name: true, slug: true, module: true } });
      results.push(...cats.map(c => ({ type: 'category', ...c })));
    }
    if (type === 'all' || type === 'providers') {
      const providers = await prisma.providerProfile.findMany({
        where: { title: keyword, verificationStatus: 'verified' },
        take: 5,
        select: { id: true, title: true, user: { select: { firstName: true, lastName: true } } },
      });
      results.push(...providers.map(p => ({ type: 'provider', id: p.id, name: `${p.user.firstName} ${p.user.lastName}`, title: p.title })));
    }

    return success(res, results);
  } catch (err) {
    next(err);
  }
};

const getFilters = async (req, res, next) => {
  try {
    const { module: mod } = req.query;
    const categories = await prisma.category.findMany({
      where: { isActive: true, ...(mod ? { module: mod } : {}) },
      select: { id: true, name: true, slug: true, module: true },
      orderBy: { displayOrder: 'asc' },
    });

    return success(res, {
      categories,
      employmentTypes: ['full_time', 'part_time', 'contract', 'temporary'],
      workLocations: ['on_site', 'remote', 'hybrid'],
      budgetTypes: ['fixed', 'hourly', 'milestone-based'],
      projectScopes: ['small', 'medium', 'large'],
      urgencyLevels: ['low', 'medium', 'high', 'emergency'],
      verificationLevels: ['basic', 'intermediate', 'advanced'],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { globalSearch, searchProviders, searchJobs, searchProjects, autocomplete, getFilters, getCategories, getSkills };


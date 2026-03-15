const { success, error } = require('../utils/response');

const prisma = require('../lib/prisma');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        skills: { include: { skill: true } },
        certifications: true,
        portfolio: true,
      },
    });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    return success(res, profile);
  } catch (err) {
    next(err);
  }
};

const createProfile = async (req, res, next) => {
  try {
    // Idempotent: return existing profile if already created
    const existing = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) return success(res, existing, 200);

    const { title, tagline, hourlyRate, bio } = req.body;

    const profile = await prisma.providerProfile.create({
      data: {
        userId: req.user.id,
        title: title || null,
        // Accept bio or tagline — frontend sends bio, DB stores as tagline
        tagline: bio || tagline || null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    });

    // Mark user as a provider so they can switch modes
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isProvider: true },
    });

    return success(res, profile, 201);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');

    const { title, tagline, hourlyRate, bio, serviceRadius, acceptsRemoteWork } = req.body;
    const updated = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(title !== undefined && { title }),
        // Accept bio or tagline — frontend sends bio, DB stores as tagline
        ...((bio !== undefined || tagline !== undefined) && { tagline: bio ?? tagline }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
        ...(serviceRadius !== undefined && { serviceRadius: parseInt(serviceRadius) }),
        ...(acceptsRemoteWork !== undefined && { acceptsRemoteWork }),
      },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const getSkills = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const skills = await prisma.providerSkill.findMany({
      where: { providerId: profile.id },
      include: { skill: true },
    });
    return success(res, skills);
  } catch (err) {
    next(err);
  }
};

const addSkill = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const { skillId, yearsOfExperience, proficiencyLevel } = req.body;
    const skill = await prisma.providerSkill.create({
      data: { providerId: profile.id, skillId, yearsOfExperience, proficiencyLevel },
      include: { skill: true },
    });
    return success(res, skill, 201);
  } catch (err) {
    next(err);
  }
};

const removeSkill = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    await prisma.providerSkill.deleteMany({ where: { id: req.params.id, providerId: profile.id } });
    return success(res, { success: true });
  } catch (err) {
    next(err);
  }
};

const getCertifications = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const certs = await prisma.providerCertification.findMany({ where: { providerId: profile.id } });
    return success(res, certs);
  } catch (err) {
    next(err);
  }
};

const addCertification = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const { name, issuingOrganization, issueDate, expiryDate, credentialId } = req.body;
    const cert = await prisma.providerCertification.create({
      data: { providerId: profile.id, name, issuingOrganization, issueDate, expiryDate, credentialId },
    });
    return success(res, cert, 201);
  } catch (err) {
    next(err);
  }
};

const updateCertification = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const cert = await prisma.providerCertification.updateMany({
      where: { id: req.params.id, providerId: profile.id },
      data: req.body,
    });
    return success(res, cert);
  } catch (err) {
    next(err);
  }
};

const deleteCertification = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    await prisma.providerCertification.deleteMany({ where: { id: req.params.id, providerId: profile.id } });
    return success(res, { success: true });
  } catch (err) {
    next(err);
  }
};

const getPortfolio = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const items = await prisma.providerPortfolio.findMany({ where: { providerId: profile.id } });
    return success(res, items);
  } catch (err) {
    next(err);
  }
};

const addPortfolioItem = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const item = await prisma.providerPortfolio.create({
      data: { providerId: profile.id, ...req.body },
    });
    return success(res, item, 201);
  } catch (err) {
    next(err);
  }
};

const updatePortfolioItem = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    const item = await prisma.providerPortfolio.updateMany({
      where: { id: req.params.id, providerId: profile.id },
      data: req.body,
    });
    return success(res, item);
  } catch (err) {
    next(err);
  }
};

const deletePortfolioItem = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return error(res, 'Provider profile not found', 404, 'NOT_FOUND');
    await prisma.providerPortfolio.deleteMany({ where: { id: req.params.id, providerId: profile.id } });
    return success(res, { success: true });
  } catch (err) {
    next(err);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, city: true, state: true, createdAt: true } },
        skills: { include: { skill: true } },
        certifications: true,
        portfolio: true,
      },
    });
    if (!profile) return error(res, 'Provider not found', 404, 'NOT_FOUND');

    // Normalize to ProviderPublicProfile shape expected by the frontend
    const normalized = {
      id: profile.id,
      userId: profile.user.id,
      displayName: profile.user.displayName || `${profile.user.firstName} ${profile.user.lastName}`.trim(),
      avatarUrl: profile.user.avatarUrl || null,
      title: profile.title || '',
      bio: profile.tagline || '',
      hourlyRate: profile.hourlyRate ? parseFloat(profile.hourlyRate) : null,
      location: (profile.user.city || profile.user.state)
        ? { city: profile.user.city || '', state: profile.user.state || '', country: 'US' }
        : null,
      skills: profile.skills.map(s => s.skill.name),
      ratings: parseFloat(profile.averageRating) || 0,
      reviewsCount: profile.totalReviews || 0,
      completedJobs: profile.totalJobsCompleted || 0,
      portfolio: profile.portfolio.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || '',
        images: p.mediaUrls || [],
      })),
      certifications: profile.certifications,
      verificationStatus: profile.verificationStatus,
      isAvailable: profile.isAvailable,
      memberSince: profile.user.createdAt,
    };

    return success(res, normalized);
  } catch (err) {
    next(err);
  }
};

module.exports = {
	getMyProfile,
	createProfile,
	updateProfile,
	getSkills,
	addSkill,
	removeSkill,
	getCertifications,
	addCertification,
	updateCertification,
	deleteCertification,
	getPortfolio,
	addPortfolioItem,
	updatePortfolioItem,
	deletePortfolioItem,
	getPublicProfile,
};

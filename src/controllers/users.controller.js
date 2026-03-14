const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { hash, compare } = require('../utils/password');
const { success, error } = require('../utils/response');
const { sendOtp, generateOtp } = require('../lib/sms');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../lib/email');

const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  addressLine1: z.string().optional(),
  postalCode: z.string().optional(),
});

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, phone: true,
        firstName: true, lastName: true, displayName: true,
        avatarUrl: true, bio: true, currentMode: true, preferredMode: true,
        city: true, state: true, country: true, postalCode: true,
        isEmailVerified: true, isPhoneVerified: true,
        isProvider: true, isAdmin: true,
        createdAt: true, lastLoginAt: true,
        providerProfile: {
          select: { id: true, verificationStatus: true, averageRating: true, totalReviews: true },
        },
      },
    });
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    if (data.firstName || data.lastName) {
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { firstName: true, lastName: true } });
      data.displayName = `${data.firstName || user.firstName} ${data.lastName || user.lastName}`;
    }
    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return error(res, 'Invalid password data', 400, 'VALIDATION_ERROR');
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await compare(currentPassword, user.passwordHash))) {
      return error(res, 'Current password is incorrect', 400, 'VALIDATION_ERROR');
    }
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: await hash(newPassword) },
    });
    // Invalidate all sessions
    await prisma.userSession.deleteMany({ where: { userId: req.user.id } });
    return success(res, { message: 'Password updated. Please log in again.' });
  } catch (err) {
    next(err);
  }
};

const switchMode = async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['client', 'provider'].includes(mode)) {
      return error(res, 'Invalid mode', 400, 'VALIDATION_ERROR');
    }
    if (mode === 'provider' && !req.user.isProvider) {
      return error(res, 'You need a provider profile to switch to provider mode', 403, 'FORBIDDEN');
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { currentMode: mode },
      select: { id: true, currentMode: true },
    });
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await prisma.userSession.deleteMany({ where: { userId: req.user.id } });
    return success(res, { message: 'Account deactivated' });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, isActive: true, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, displayName: true,
        avatarUrl: true, bio: true, city: true, state: true, createdAt: true,
        providerProfile: {
          select: {
            title: true, tagline: true, hourlyRate: true, isAvailable: true,
            averageRating: true, totalReviews: true, totalJobsCompleted: true,
            verificationStatus: true,
          },
        },
      },
    });
    if (!user) return error(res, 'User not found', 404, 'NOT_FOUND');
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

const updateEmail = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password required', 400, 'VALIDATION_ERROR');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await compare(password, user.passwordHash))) {
      return error(res, 'Incorrect password', 400, 'VALIDATION_ERROR');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error(res, 'Email already in use', 409, 'CONFLICT');

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: req.user.id },
      data: { email, isEmailVerified: false, emailVerifyToken: token },
    });
    await sendVerificationEmail(email, token, user.firstName);

    return success(res, { message: 'Email updated. Please verify your new email address.' });
  } catch (err) {
    next(err);
  }
};

const updatePhone = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'Phone required', 400, 'VALIDATION_ERROR');

    const existing = await prisma.user.findFirst({ where: { phone, id: { not: req.user.id } } });
    if (existing) return error(res, 'Phone already in use', 409, 'CONFLICT');

    const otp = generateOtp();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { phone, isPhoneVerified: false, phoneOtp: otp, phoneOtpExpiry: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await sendOtp(phone, otp);

    return success(res, { message: 'OTP sent to your phone number' });
  } catch (err) {
    next(err);
  }
};

const verifyPhone = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) return error(res, 'OTP required', 400, 'VALIDATION_ERROR');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.phoneOtp || user.phoneOtp !== otp || user.phoneOtpExpiry < new Date()) {
      return error(res, 'Invalid or expired OTP', 400, 'VALIDATION_ERROR');
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { isPhoneVerified: true, phoneOtp: null, phoneOtpExpiry: null },
    });
    return success(res, { message: 'Phone verified' });
  } catch (err) {
    next(err);
  }
};


// ── Sessions ──────────────────────────────────────────────────────────────────

const getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: req.user.id, expiresAt: { gt: new Date() } },
      select: { id: true, ipAddress: true, deviceInfo: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, sessions);
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const deleted = await prisma.userSession.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (deleted.count === 0) return error(res, 'Session not found', 404, 'NOT_FOUND');
    return success(res, { message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    // Optionally keep the current session alive by excluding the refresh token in the request
    const { keepCurrent, currentRefreshToken } = req.body;
    const where = { userId: req.user.id };
    if (keepCurrent && currentRefreshToken) {
      where.refreshToken = { not: currentRefreshToken };
    }
    await prisma.userSession.deleteMany({ where });
    return success(res, { message: 'All sessions revoked' });
  } catch (err) {
    next(err);
  }
};

// ── Settings ──────────────────────────────────────────────────────────────────

const getPrivacySettings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { privacySettings: true },
    });
    
    // Default privacy settings if none exist
    const defaults = {
      profileVisibility: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
    };
    
    const settings = user?.privacySettings || defaults;
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

const updatePrivacySettings = async (req, res, next) => {
  try {
    const { profileVisibility, showOnlineStatus, allowDirectMessages } = req.body;
    
    // Get current settings
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { privacySettings: true },
    });
    
    const currentSettings = user?.privacySettings || {
      profileVisibility: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
    };
    
    // Merge with new settings
    const settings = {
      ...currentSettings,
      ...(profileVisibility !== undefined && { profileVisibility }),
      ...(showOnlineStatus !== undefined && { showOnlineStatus }),
      ...(allowDirectMessages !== undefined && { allowDirectMessages }),
    };
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { privacySettings: settings },
    });
    
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

const getDisplaySettings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { displaySettings: true },
    });
    
    // Default display settings if none exist
    const defaults = {
      darkMode: false,
      compactView: false,
      language: 'en',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    };
    
    const settings = user?.displaySettings || defaults;
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

const updateDisplaySettings = async (req, res, next) => {
  try {
    const { darkMode, compactView, language, currency, timezone } = req.body;
    
    // Get current settings
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { displaySettings: true },
    });
    
    const currentSettings = user?.displaySettings || {
      darkMode: false,
      compactView: false,
      language: 'en',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    };
    
    // Merge with new settings
    const settings = {
      ...currentSettings,
      ...(darkMode !== undefined && { darkMode }),
      ...(compactView !== undefined && { compactView }),
      ...(language !== undefined && { language }),
      ...(currency !== undefined && { currency }),
      ...(timezone !== undefined && { timezone }),
    };
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { displaySettings: settings },
    });
    
    return success(res, settings);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getMe, updateMe, updatePassword, switchMode, deleteMe, getUser, 
  updateEmail, updatePhone, verifyPhone, 
  getSessions, revokeSession, revokeAllSessions,
  getPrivacySettings, updatePrivacySettings,
  getDisplaySettings, updateDisplaySettings,
};

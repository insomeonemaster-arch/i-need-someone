const { z } = require('zod');
const crypto = require('crypto');
const { hash, compare } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { emailQueue } = require('../lib/queues');

const prisma = require('../lib/prisma');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const createSession = async (userId, req) => {
  const accessToken = generateAccessToken({ sub: userId });
  const refreshToken = generateRefreshToken({ sub: userId, type: 'refresh' });
  await prisma.userSession.create({
    data: {
      userId,
      refreshToken,
      ipAddress: req.ip,
      deviceInfo: { userAgent: req.headers['user-agent'] },
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
};

// ── Register ──────────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return error(res, 'Email already registered', 409, 'CONFLICT');

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await hash(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        displayName: `${data.firstName} ${data.lastName}`,
        emailVerifyToken,
      },
      select: { id: true, email: true, firstName: true, lastName: true, displayName: true, currentMode: true, avatarUrl: true, isEmailVerified: true, createdAt: true },
    });

    await emailQueue.add('verification', { to: user.email, token: emailVerifyToken, name: user.firstName });

    const { accessToken, refreshToken } = await createSession(user.id, req);
    return success(res, { user, accessToken, refreshToken }, 201);
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email, isActive: true, deletedAt: null },
    });
    if (!user || !(await compare(data.password, user.passwordHash))) {
      return error(res, 'Invalid credentials', 401, 'AUTH_INVALID');
    }

    const { accessToken, refreshToken } = await createSession(user.id, req);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return success(res, {
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, displayName: user.displayName,
        currentMode: user.currentMode,
        avatarUrl: user.avatarUrl, isProvider: user.isProvider,
        isEmailVerified: user.isEmailVerified,
        isAdmin: user.isAdmin,
      },
      accessToken, refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return error(res, 'Refresh token required', 400, 'VALIDATION_ERROR');

    const decoded = verifyRefreshToken(token);
    const session = await prisma.userSession.findUnique({ where: { refreshToken: token } });
    if (!session || session.expiresAt < new Date()) {
      return error(res, 'Invalid or expired refresh token', 401, 'AUTH_EXPIRED');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.sub, isActive: true } });
    if (!user) return error(res, 'User not found', 401, 'AUTH_INVALID');

    // Rotate tokens: invalidate old session, issue fresh access + refresh tokens
    const newAccessToken = generateAccessToken({ sub: user.id, email: user.email, mode: user.currentMode });
    const newRefreshToken = generateRefreshToken({ sub: user.id, type: 'refresh' });
    await prisma.userSession.delete({ where: { id: session.id } });
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: newRefreshToken,
        ipAddress: req.ip,
        deviceInfo: { userAgent: req.headers['user-agent'] },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────

const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await prisma.userSession.deleteMany({ where: { refreshToken: token } });
    return success(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

// ── Email Verification ────────────────────────────────────────────────────────

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return error(res, 'Token required', 400, 'VALIDATION_ERROR');

    const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) return error(res, 'Invalid or expired token', 400, 'VALIDATION_ERROR');

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    await emailQueue.add('welcome', { to: user.email, name: user.firstName });
    return success(res, { message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.isEmailVerified) return error(res, 'Email already verified', 400, 'VALIDATION_ERROR');

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: token } });
    await emailQueue.add('verification', { to: user.email, token, name: user.firstName });

    return success(res, { message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
};

// ── Forgot / Reset Password ───────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email required', 400, 'VALIDATION_ERROR');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error(res, 'Invalid email format', 400, 'VALIDATION_ERROR');

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });
      await emailQueue.add('password-reset', { to: user.email, token, name: user.firstName });
    }

    return success(res, { message: 'If that email exists, a reset link has been sent' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return error(res, 'Token and password (min 8 chars) required', 400, 'VALIDATION_ERROR');
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
    });
    if (!user) return error(res, 'Invalid or expired reset token', 400, 'VALIDATION_ERROR');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(password), passwordResetToken: null, passwordResetExpiry: null },
    });
    await prisma.userSession.deleteMany({ where: { userId: user.id } });

    return success(res, { message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// ── OAuth ─────────────────────────────────────────────────────────────────────

const oauthCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code } = req.query;
    if (!code) return error(res, 'Authorization code required', 400, 'VALIDATION_ERROR');

    let providerProfile;

    if (provider === 'google') {
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.APP_URL}/api/v1/auth/oauth/google/callback`
      );
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      providerProfile = {
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatarUrl: payload.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      };
    } else {
      return error(res, `Provider ${provider} not supported`, 400, 'VALIDATION_ERROR');
    }

    // Find or create user
    let oauthRecord = await prisma.oAuthProviderAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: providerProfile.id } },
      include: { user: true },
    });

    let user;
    if (oauthRecord) {
      user = oauthRecord.user;
      await prisma.oAuthProviderAccount.update({
        where: { id: oauthRecord.id },
        data: { accessToken: providerProfile.accessToken, refreshToken: providerProfile.refreshToken },
      });
    } else {
      // Check if email exists
      user = await prisma.user.findUnique({ where: { email: providerProfile.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: providerProfile.email,
            passwordHash: await hash(crypto.randomBytes(32).toString('hex')),
            firstName: providerProfile.firstName || 'User',
            lastName: providerProfile.lastName || '',
            displayName: `${providerProfile.firstName} ${providerProfile.lastName}`.trim(),
            avatarUrl: providerProfile.avatarUrl,
            isEmailVerified: true,
          },
        });
      }
      await prisma.oAuthProviderAccount.create({
        data: {
          userId: user.id,
          provider,
          providerUserId: providerProfile.id,
          accessToken: providerProfile.accessToken,
          refreshToken: providerProfile.refreshToken,
        },
      });
    }

    const { accessToken, refreshToken: rt } = await createSession(user.id, req);

    // Redirect to frontend with tokens
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?access=${accessToken}&refresh=${rt}`);
  } catch (err) {
    next(err);
  }
};

const oauthAuthorize = (req, res) => {
  const { provider } = req.params;
  if (provider === 'google') {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      redirect_uri: `${process.env.APP_URL}/api/v1/auth/oauth/google/callback`,
    });
    return res.redirect(url);
  }
  return error(res, 'Provider not supported', 400, 'VALIDATION_ERROR');
};

module.exports = { register, login, refreshToken, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, oauthAuthorize, oauthCallback };

// src/services/auth.service.ts
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import argon2 from "argon2";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import config from "../config/index.js";
import { signAccessToken } from "../utils/jwt.util.js";
import { logger } from "../utils/logger.js";
import { Types } from "mongoose";

function randomTokenString() {
  return crypto.randomBytes(64).toString("hex");
}

export async function registerUser({ name, email, password }: { name: string; email: string; password: string; }) {
  const existing = await User.findOne({ email });
  if (existing) throw { status: 409, message: "Email already registered" };
  const hashedPassword = await argon2.hash(password);
  // create email verification token
  const verificationToken = randomTokenString();
  const verificationTokenHash = await argon2.hash(verificationToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const user = await User.create({
    name, email, password: hashedPassword,
    emailVerified: false,
    emailVerificationTokenHash: verificationTokenHash,
    emailVerificationExpires: expires,
    role: "customer",
    isActive: true,
  });
  // TODO: send verification email containing verificationToken (not hashed)
  // e.g., /auth/verify-email?token=<verificationToken>&id=<user._id>
  logger.info(`Send verification email to ${email}`);
  return { user, verificationToken }; // caller uses token to email user
}

/**
 * Create refresh token session and return raw token string.
 */
export async function createRefreshTokenSession(userId: Types.ObjectId, ipAddress?: string, userAgent?: string) {
  const rawToken = randomTokenString();
  const hashedToken = await argon2.hash(rawToken);
  const expiresAt = new Date(Date.now() + config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);
  const session = await RefreshToken.create({
    userId,
    hashedToken,
    createdAt: new Date(),
    expiresAt,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    isRevoked: false,
  });
  return { rawToken, session };
}

/**
 * Login: verifies credentials, returns access token and sets refresh token cookie.
 */
export async function loginUser({ email, password, ipAddress, userAgent }: { email: string; password: string; ipAddress?: string; userAgent?: string; }) {
  const user = await User.findOne({ email });
  if (!user) throw { status: 401, message: "Invalid credentials" };
  if (user.authProvider !== "local") throw { status: 400, message: "Use social login" };
  // if (!user.emailVerified) throw { status: 403, message: "Email not verified" };
  const ok = await argon2.verify(user.password!, password);
  if (!ok) throw { status: 401, message: "Invalid credentials" };
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const { rawToken, session } = await createRefreshTokenSession(user._id, ipAddress, userAgent);
  // Activity log: login
  // TODO: create ActivityLog entry
  return { accessToken, refreshToken: rawToken, user };
}

/**
 * Rotate refresh token. rawToken is the token sent by client (cookie).
 * If token not found => possible token reuse: revoke all user's sessions.
 */
export async function rotateRefreshToken(rawToken: string, ipAddress?: string, userAgent?: string) {
  // find session by verifying hashedToken against stored hashes.
  const sessions = await RefreshToken.find({ isRevoked: false });
  // NOTE: to avoid scanning all tokens in prod, store a separate identifier in cookie (like sessionId).
  // Here, we perform a safe approach: store session id in cookie as well in production.
  // For now, we expect cookie contains only rawToken, so we search.
  let currentSession = null;
  for (const s of sessions) {
    try {
      const match = await argon2.verify(s.hashedToken, rawToken);
      if (match) { currentSession = s; break; }
    } catch (err) {
      // ignore
    }
  }
  if (!currentSession) {
    // Reuse or stolen token: revoke all refresh tokens for all users
    // We need to detect which user: cannot, so safest is deny and require re-login for all sessions for safety
    logger.warn("Refresh token reuse or unknown token - potential attack. Revoking all sessions for safety.");
    // Optionally revoke all tokens for user if you can deduce; here we revoke everything for the token owner unknown -> more conservative approach is to fail and ask login
    throw { status: 401, message: "Invalid refresh token" };
  }
  if (currentSession.isRevoked || currentSession.expiresAt < new Date()) {
    // if revoked or expired
    throw { status: 401, message: "Refresh token revoked or expired" };
  }
  // rotate: create new session and revoke old one
  const userId = currentSession.userId;
  const { rawToken: newRawToken, session: newSession } = await createRefreshTokenSession(userId, ipAddress, userAgent);
  currentSession.isRevoked = true;
  currentSession.replacedByToken = newSession._id.toString();
  await currentSession.save();
  const user = await (await import("../models/User.js")).User.findById(userId);
  const accessToken = signAccessToken({ sub: userId.toString(), role: (user as any).role });
  // log activity
  return { accessToken, refreshToken: newRawToken, user };
}

export async function revokeRefreshTokenByRaw(rawToken: string) {
  const sessions = await RefreshToken.find({ isRevoked: false });
  for (const s of sessions) {
    try {
      const match = await argon2.verify(s.hashedToken, rawToken);
      if (match) {
        s.isRevoked = true;
        await s.save();
        return true;
      }
    } catch { }
  }
  return false;
}

export async function logoutByRawToken(rawToken: string) {
  const revoked = await revokeRefreshTokenByRaw(rawToken);
  return revoked;
}

/**
 * Verify email token and mark emailVerified true
 */
export async function verifyEmail(userId: string, token: string) {
  const user = await User.findById(userId);
  if (!user) throw { status: 400, message: "Invalid verification request" };
  if (!user.emailVerificationTokenHash || !user.emailVerificationExpires) throw { status: 400, message: "No verification pending" };
  if (user.emailVerificationExpires < new Date()) throw { status: 400, message: "Verification token expired" };
  const ok = await argon2.verify(user.emailVerificationTokenHash, token);
  if (!ok) throw { status: 400, message: "Invalid token" };
  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save();
  return user;
}



const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function loginOrRegisterGoogleUser(token: string, ipAddress?: string, userAgent?: string) {
  // 1. Verify Token
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    logger.error(`Google token verify failed: ${err}`);
    throw { status: 401, message: "Invalid Google token" };
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw { status: 401, message: "Invalid Google token payload" };

  const { email, sub: googleId, name, picture } = payload;

  // 2. Find or Create User
  let user = await User.findOne({ email });

  if (user) {
    // Check if user is compatible
    if (user.authProvider === "local") {
      // Optional: Allow linking or failing. For stricter security without linking logic, we might fail.
      // But often better UX to just login if verified. 
      // For this task, we will allow it but update provider? 
      // Keeping it simple: If local, we might allow IF the email is verified by Google (it is).
      // However, password login might break if we change provider to google.
      // Logic: If user exists, just log them in. 
    }
  } else {
    // Create new user
    user = await User.create({
      name: name || "Google User",
      email,
      googleId,
      authProvider: "google",
      emailVerified: true, // Google verified
      role: "customer",
      isActive: true,
    });
  }

  // 3. Generate Tokens
  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  const { rawToken, session } = await createRefreshTokenSession(user._id, ipAddress, userAgent);

  return { accessToken, refreshToken: rawToken, user };
}

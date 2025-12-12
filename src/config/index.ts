// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || "4000",
  mongoUrl: process.env.MONGO_DB_URL || "",
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "",
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m", // 15m
    refreshTokenExpiresDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10),
  },
  cookie: {
    refreshTokenName: process.env.REFRESH_COOKIE_NAME || "rt",
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.COOKIE_SAMESITE as "Strict" | "Lax" | "None") || "Strict",
    httpOnly: true,
  },
  rateLimit: {
    authWindowMs: 10 * 60 * 1000, // 10 minutes
    authMax: 5, // 5 attempts per IP
  }
};

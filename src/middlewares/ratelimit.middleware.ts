// src/middlewares/rateLimit.middleware.ts
import rateLimit from "express-rate-limit";
import config from "../config/index.js";

export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try later." },
});

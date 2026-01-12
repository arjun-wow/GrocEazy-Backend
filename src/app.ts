// src/app.ts
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import corsOptions from "./config/corsConfig.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import config from "./config/index.js";

export function createApp() {
  const app = express();

  // Disable strict CSP for local dev to avoid extension/devtools blocks.
  // Keep CSP enabled in production by toggling via NODE_ENV.
  const helmetOptions = process.env.NODE_ENV === "production" ? {} : { contentSecurityPolicy: false };
  app.use(helmet(helmetOptions));

  app.use(express.json());
  app.use(cookieParser());
  app.use(corsOptions);

  // Root route so visiting http://localhost:4000/ shows something instead of 404
  app.get("/", (req, res) => res.send("GrocEazy Backend — API lives at /api"));

  // Health check (useful for uptime checks)
  app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

  // Mount main API router
  app.use("/api/v1", routes);

  app.use(errorHandler);
  return app;
}

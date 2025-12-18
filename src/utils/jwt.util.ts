// src/utils/jwt.util.ts
import jwt from "jsonwebtoken";
import type { SignOptions, Secret } from "jsonwebtoken";
import config from "../config/index.js";

export function signAccessToken(payload: object) {
  // ensure a runtime default so the value is never undefined, then cast safely
  const options = {
    expiresIn: (config.jwt.accessTokenExpiresIn ?? "15m") as SignOptions["expiresIn"],
  } as unknown as SignOptions;

  return jwt.sign(payload, config.jwt.accessTokenSecret as Secret, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwt.accessTokenSecret as Secret);
}

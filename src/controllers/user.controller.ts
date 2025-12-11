// src/controllers/user.controller.ts
import type { Request, Response } from "express";

export async function me(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user });
}

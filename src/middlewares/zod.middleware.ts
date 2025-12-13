import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

export const validateBody =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? 'Invalid request body';

      return res.status(400).json({
        success: false,
        message,
      });
    }

    req.body = result.data;
    next();
  };

export const validateParams =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const message =
        result.error.issues[0]?.message ?? 'Invalid request parameters';

      return res.status(400).json({
        success: false,
        message,
      });
    }

    req.params = result.data as Record<string, string>;
    next();
  };

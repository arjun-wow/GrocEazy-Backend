import type { Request, Response, NextFunction } from "express";
import { validationResult, type FieldValidationError } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formatted = result.array().map(err => {
      const fieldErr = err as Partial<FieldValidationError>;

      return {
        field: fieldErr.path ?? "unknown",
        message: err.msg
      };
    });

    return res.status(400).json({
      success: false,
      errors: formatted
    });
  }

  next();
};

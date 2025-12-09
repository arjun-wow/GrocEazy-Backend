import { body } from "express-validator";

export const activityValidators = {
  create: [
    body("action").notEmpty(),
    body("module").notEmpty(),
    body("metadata").optional().isObject()
  ]
};

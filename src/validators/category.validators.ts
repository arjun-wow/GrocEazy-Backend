import { body, param } from "express-validator";

export const categoryValidators = {
  create: [
    body("name")
      .trim()
      .notEmpty().withMessage("Category name is required")
  ],

  update: [
    param("id").isMongoId().withMessage("Invalid Category ID"),

    body("name").optional().trim().notEmpty()
  ],

  delete: [
    param("id").isMongoId().withMessage("Invalid Category ID")
  ]
};

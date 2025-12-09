import { body } from "express-validator";

export const categoryValidators = {
  create: [
    body("name").notEmpty().withMessage("Category name is required"),

    body("parentCategoryId")
      .optional()
      .isMongoId().withMessage("Invalid parentCategoryId")
  ],

  update: [
    body("name").optional().notEmpty(),
    body("parentCategoryId").optional().isMongoId()
  ]
};

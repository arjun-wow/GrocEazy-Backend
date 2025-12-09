import { body } from "express-validator";

export const productValidators = {
  create: [
    body("name").notEmpty().withMessage("Product name required"),
    body("description").notEmpty().withMessage("Description required"),
    body("size").optional().isString(),
    body("dietary").optional().isString(),

    body("stock")
      .isInt({ min: 0 })
      .withMessage("Stock must be non-negative"),

    body("lowStockThreshold")
      .isInt({ min: 0 }),

    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),

    body("categoryId")
      .isMongoId().withMessage("Invalid categoryId"),

    body("images")
      .isArray({ min: 1 })
      .withMessage("At least one image required"),
  ],

  update: [
    body("name").optional().notEmpty(),
    body("price").optional().isFloat({ gt: 0 }),
    body("stock").optional().isInt({ min: 0 }),
    body("categoryId").optional().isMongoId(),
    body("images").optional().isArray(),
  ],

  delete: [
    body("productId").isMongoId().withMessage("Invalid productId")
  ]
};

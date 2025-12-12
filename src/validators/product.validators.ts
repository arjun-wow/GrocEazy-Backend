import { body, param } from "express-validator";

export const productValidators = {
  create: [
    body("name")
      .trim()
      .notEmpty().withMessage("Product name is required"),

    body("description")
      .trim()
      .notEmpty().withMessage("Description is required"),

    body("size")
      .optional()
      .isString()
      .trim(),

    body("dietary")
      .optional()
      .isString()
      .trim(),

    body("stock")
      .notEmpty().withMessage("Stock is required")
      .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

    body("lowStockThreshold")
      .optional()
      .isInt({ min: 0 }).withMessage("Low stock threshold must be a non-negative integer"),

    body("price")
      .notEmpty().withMessage("Price is required")
      .isFloat({ gt: 0 }).withMessage("Price must be greater than 0"),

    body("categoryId")
      .notEmpty().withMessage("Category ID is required")
      .isMongoId().withMessage("Invalid Category ID format"),

    // Images are handled via multer but we can check if body has it if not file upload? 
    // Usually images are uploaded as files. validator usually validates body. 
    // If strict on image presence, we might need custom validator or rely on controller check of req.files.
    // For now, standard fields.
  ],

  update: [
    param("id").isMongoId().withMessage("Invalid Product ID"),

    body("name").optional().trim().notEmpty(),
    body("description").optional().trim().notEmpty(),
    body("size").optional().isString().trim(),
    body("dietary").optional().isString().trim(),
    body("stock").optional().isInt({ min: 0 }),
    body("lowStockThreshold").optional().isInt({ min: 0 }),
    body("price").optional().isFloat({ gt: 0 }),
    body("categoryId").optional().isMongoId(),
    body("isActive").optional().isBoolean(),
  ],

  delete: [
    param("id").isMongoId().withMessage("Invalid Product ID")
  ]
};

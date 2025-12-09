import { body } from "express-validator";

export const cartValidators = {
  addItem: [
    body("productId").isMongoId().withMessage("Invalid productId"),
    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1")
  ],

  updateItem: [
    body("productId").isMongoId(),
    body("quantity").isInt({ min: 1 })
  ],

  removeItem: [
    body("productId").isMongoId()
  ]
};

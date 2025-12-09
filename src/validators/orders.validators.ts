import { body } from "express-validator";

export const orderValidators = {
  placeOrder: [
    body("address.fullName").notEmpty(),
    body("address.line1").notEmpty(),
    body("address.city").notEmpty(),
    body("address.state").notEmpty(),
    body("address.postalCode").notEmpty(),
    body("address.phone").notEmpty(),

    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must contain at least 1 item"),

    body("items.*.productId").isMongoId(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("items.*.unitPrice").isFloat({ gt: 0 }),
  ],

  updateStatus: [
    body("status")
      .isIn(["processing","packed","shipped","delivered","cancelled"])
      .withMessage("Invalid order status")
  ]
};

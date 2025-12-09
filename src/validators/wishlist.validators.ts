import { body } from "express-validator";

export const wishlistValidators = {
  add: [
    body("productId").isMongoId().withMessage("Invalid productId")
  ],
  remove: [
    body("productId").isMongoId()
  ]
};

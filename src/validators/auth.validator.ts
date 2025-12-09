import { body } from "express-validator";

export const authValidators = {
  signup: [
    body("name").notEmpty().withMessage("Name is required"),

    body("email")
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],

  login: [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],

  forgotPassword: [
    body("email")
      .notEmpty().withMessage("Email required")
      .isEmail().withMessage("Enter a valid email")
  ],

  resetPassword: [
    body("token").notEmpty().withMessage("Reset token required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
  ]
};

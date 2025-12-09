import { body } from "express-validator";

export const ticketValidators = {
  create: [
    body("subject").notEmpty().withMessage("Subject is required"),
    body("description").notEmpty().withMessage("Description required")
  ],

  updateStatus: [
    body("status")
      .isIn(["open","in_progress","resolved","closed"])
      .withMessage("Invalid ticket status")
  ]
};

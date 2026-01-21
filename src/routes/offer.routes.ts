import { Router } from "express";
import * as offerController from "../controllers/offer.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validateBody } from "../middlewares/zod.middleware.js";
import { createOfferSchema, updateOfferSchema } from "../validators/offer.validators.js";

const router = Router();

router.get("/", offerController.getAllOffers);
router.get("/active", offerController.getActiveOffers);

// Manager only
router.post("/", authenticate, authorize(["manager", "admin"]), validateBody(createOfferSchema), offerController.createOffer);
router.put("/:id", authenticate, authorize(["manager", "admin"]), validateBody(updateOfferSchema), offerController.updateOffer);
router.delete("/:id", authenticate, authorize(["manager", "admin"]), offerController.deleteOffer);

export default router;

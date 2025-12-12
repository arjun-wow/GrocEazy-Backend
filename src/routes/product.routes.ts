import { Router } from "express";
// import multer from "multer"; // Removed
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from "../controllers/product.controller.js";
import { productValidators } from "../validators/product.validators.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateRequest } from "../middlewares/validate.middleware.js";

import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected routes (Manager only)
router.post(
    "/",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.array("images", 5),
    productValidators.create,
    validateRequest,
    createProduct
);

router.put(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.array("images", 5),
    productValidators.update,
    validateRequest,
    updateProduct
);

router.delete(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    productValidators.delete,
    validateRequest,
    deleteProduct
);

export default router;

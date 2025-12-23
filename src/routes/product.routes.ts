import { Router } from "express";
// import multer from "multer"; // Removed
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getSimilarProducts,
    getTopProducts,
} from "../controllers/product.controller.js";
import { productValidators } from "../validators/product.validators.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody, validateParams, validateQuery } from "../middlewares/zod.middleware.js";

import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Public routes
router.get("/", validateQuery(productValidators.getProductsQuerySchema), getAllProducts);
router.get("/recommendations/top-10", getTopProducts); // specific route BEFORE /:id
router.get("/:id/similar", validateParams(productValidators.productIdSchema), getSimilarProducts);        // specific route
router.get("/:id", validateParams(productValidators.productIdSchema), getProductById);                    // generic catch-all for ID

// Protected routes (Manager only)
router.post(
    "/",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.array("images", 5),
    validateBody(productValidators.createProductSchema),
    createProduct
);

router.put(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.array("images", 5),
    validateParams(productValidators.productIdSchema),
    validateBody(productValidators.updateProductSchema),
    updateProduct
);

router.delete(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    validateParams(productValidators.productIdSchema),
    deleteProduct
);

export default router;

import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { categoryValidators } from "../validators/category.validators.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { validateBody, validateParams } from "../middlewares/zod.middleware.js";

const router = Router();

// Protected routes (Manager only)
router.get(
    "/manager",
    authenticate,
    requireRole(["manager", "admin"]),
    getAllCategories
);

// Public routes
router.get("/", getAllCategories);
router.get("/:id", validateParams(categoryValidators.categoryIdSchema), getCategoryById);

// Protected routes (Manager only)
router.post(
    "/",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.single("image"),
    validateBody(categoryValidators.createCategorySchema),
    createCategory
);

router.put(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.single("image"),
    validateParams(categoryValidators.categoryIdSchema),
    validateBody(categoryValidators.updateCategorySchema),
    updateCategory
);

router.delete(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    validateParams(categoryValidators.categoryIdSchema),
    deleteCategory
);

export default router;

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
import { validateRequest } from "../middlewares/validate.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Protected routes (Manager only)
router.post(
    "/",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.single("image"),
    categoryValidators.create,
    validateRequest,
    createCategory
);

router.put(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    upload.single("image"),
    categoryValidators.update,
    validateRequest,
    updateCategory
);

router.delete(
    "/:id",
    authenticate,
    requireRole(["manager", "admin"]),
    categoryValidators.delete,
    validateRequest,
    deleteCategory
);

export default router;

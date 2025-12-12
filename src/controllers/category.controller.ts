import type { Request, Response } from "express";

import CategoryService from "../services/category.service.js";
import { logger } from "../utils/logger.js";

export const createCategory = async (req: Request, res: Response) => {
    try {
        if (req.file) {
            req.body.image = req.file.path;
        }
        const category = await CategoryService.createCategory(req.body);
        return res.status(201).json(category);
    } catch (error) {
        logger.error("Error creating category", error);
        return res.status(500).json({ message: "Error creating category", error });
    }
};

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await CategoryService.getAllCategories();
        return res.status(200).json(categories);
    } catch (error) {
        logger.error("Error fetching categories", error);
        return res.status(500).json({ message: "Error fetching categories", error });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const category = await CategoryService.getCategoryById(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    } catch (error) {
        logger.error("Error fetching category", error);
        return res.status(500).json({ message: "Error fetching category", error });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        if (req.file) {
            req.body.image = req.file.path;
        }
        const category = await CategoryService.updateCategory(id, req.body);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(category);
    } catch (error) {
        logger.error("Error updating category", error);
        return res.status(500).json({ message: "Error updating category", error });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const category = await CategoryService.deleteCategory(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        logger.error("Error deleting category", error);
        return res.status(500).json({ message: "Error deleting category", error });
    }
};

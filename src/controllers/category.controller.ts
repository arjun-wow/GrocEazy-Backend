import type { Request, Response, RequestHandler } from "express";
import CategoryService from "../services/category.service.js";
import { logger } from "../utils/logger.js";

export const createCategory: RequestHandler = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if ((req as any).file) {
            data.image = (req as any).file.path;
        }

        const category = await CategoryService.createCategory(data);
        res.status(201).json(category);
    } catch (error) {
        logger.error("Error creating category", error);
        res.status(500).json({ message: "Error creating category", error });
    }
};

export const getAllCategories: RequestHandler = async (req, res, next) => {
    try {
        const categories = await CategoryService.getAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        logger.error("Error fetching categories", error);
        res.status(500).json({ message: "Error fetching categories", error });
    }
};

export const getCategoryById: RequestHandler = async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const category = await CategoryService.getCategoryById(id);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.status(200).json(category);
    } catch (error) {
        logger.error("Error fetching category", error);
        res.status(500).json({ message: "Error fetching category", error });
    }
};

export const updateCategory: RequestHandler = async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const data = { ...req.body };
        if ((req as any).file) {
            data.image = (req as any).file.path;
        }

        const category = await CategoryService.updateCategory(id, data);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.status(200).json(category);
    } catch (error) {
        logger.error("Error updating category", error);
        res.status(500).json({ message: "Error updating category", error });
    }
};

export const deleteCategory: RequestHandler = async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const category = await CategoryService.deleteCategory(id);
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        logger.error("Error deleting category", error);
        res.status(500).json({ message: "Error deleting category", error });
    }
};

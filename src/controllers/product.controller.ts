import type { Request, Response, RequestHandler } from "express";

import ProductService from "../services/product.service.js";
import { logger } from "../utils/logger.js";

import { createProductSchema, updateProductSchema, productIdSchema } from "../validators/product.validators.js";

export const createProduct: RequestHandler = async (req, res, next) => {
    try {
        const files = (req as any).files as Express.Multer.File[] | undefined;
        // Use parsed data safely
        const productData = {
            ...req.body,
            createdBy: (req as any).user?._id
        };

        const product = await ProductService.createProduct(productData, files);
        res.status(201).json(product);
    } catch (error) {
        logger.error("Error creating product", error);
        res.status(500).json({ message: "Error creating product", error });
    }
};

export const getAllProducts: RequestHandler = async (req, res, next) => {
    // Query params validation optional for now, or add specific schema if needed
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const filter = {
            categoryId: req.query.categoryId as string,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
            search: req.query.search as string,
            dietary: req.query.dietary as string,
        };

        const result = await ProductService.getAllProducts(filter, page, limit);
        res.status(200).json(result);
    } catch (error) {
        logger.error("Error fetching products", error);
        res.status(500).json({ message: "Error fetching products", error });
    }
};

export const getProductById: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }
        const product = await ProductService.getProductById(id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        res.status(200).json(product);
    } catch (error) {
        logger.error("Error fetching product", error);
        res.status(500).json({ message: "Error fetching product", error });
    }
};

export const updateProduct: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }
        const files = (req as any).files as Express.Multer.File[] | undefined;

        const product = await ProductService.updateProduct(id, req.body, files);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        res.status(200).json(product);
    } catch (error) {
        logger.error("Error updating product", error);
        res.status(500).json({ message: "Error updating product", error });
    }
};

export const deleteProduct: RequestHandler = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }
        const product = await ProductService.deleteProduct(id);
        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        logger.error("Error deleting product", error);
        res.status(500).json({ message: "Error deleting product", error });
    }
};

export const getSimilarProducts: RequestHandler = async (req, res, next) => {
    try {
        const id = req.params.id as string;
        const limit = parseInt(req.query.limit as string) || 6;

        const products = await ProductService.getSimilarProducts(id, limit);
        res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching similar products", error);
        res.status(500).json({ message: "Error fetching similar products", error });
    }
};

export const getTopProducts: RequestHandler = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const products = await ProductService.getTopProducts(limit);
        res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching top products", error);
        res.status(500).json({ message: "Error fetching top products", error });
    }
};

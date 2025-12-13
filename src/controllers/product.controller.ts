import type { Request, Response } from "express";

import ProductService from "../services/product.service.js";
import { logger } from "../utils/logger.js";

export const createProduct = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[] | undefined;
        const productData = {
            ...req.body,
            createdBy: req.user?._id
        };

        const product = await ProductService.createProduct(productData, files);
        return res.status(201).json(product);
    } catch (error) {
        logger.error("Error creating product", error);
        return res.status(500).json({ message: "Error creating product", error });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
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
        return res.status(200).json(result);
    } catch (error) {
        logger.error("Error fetching products", error);
        return res.status(500).json({ message: "Error fetching products", error });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const product = await ProductService.getProductById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json(product);
    } catch (error) {
        logger.error("Error fetching product", error);
        return res.status(500).json({ message: "Error fetching product", error });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const files = req.files as Express.Multer.File[] | undefined;

        const product = await ProductService.updateProduct(id, req.body, files);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json(product);
    } catch (error) {
        logger.error("Error updating product", error);
        return res.status(500).json({ message: "Error updating product", error });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const product = await ProductService.deleteProduct(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        logger.error("Error deleting product", error);
        return res.status(500).json({ message: "Error deleting product", error });
    }
};

export const getSimilarProducts = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const limit = parseInt(req.query.limit as string) || 6;

        const products = await ProductService.getSimilarProducts(id, limit);
        return res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching similar products", error);
        return res.status(500).json({ message: "Error fetching similar products", error });
    }
};

export const getTopProducts = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;

        const products = await ProductService.getTopProducts(limit);
        return res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching top products", error);
        return res.status(500).json({ message: "Error fetching top products", error });
    }
};

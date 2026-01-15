import type { RequestHandler } from "express";
import ProductService from "../services/product.service.js";
import { logger } from "../utils/logger.js";

const getString = (value: unknown): string => {
    if (Array.isArray(value)) return value[0];
    return value as string;
};

const getNumber = (value: unknown, defaultVal: number): number => {
    const v = Array.isArray(value) ? value[0] : value;
    const n = Number(v);
    return isNaN(n) ? defaultVal : n;
};

export const createProduct: RequestHandler = async (req, res) => {
    try {
        const files = (req as any).files as Express.Multer.File[] | undefined;

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

export const getAllProducts: RequestHandler = async (req, res) => {
    try {
        const page = getNumber(req.query.page, 1);
        const limit = getNumber(req.query.limit, 10);

        const filter = { ...req.query };
        delete (filter as any).page;
        delete (filter as any).limit;

        const user = (req as any).user;

        const isManagerRoute =
            req.baseUrl.includes("/manager/all") || req.path.includes("/manager/all");

        const includeInactive =
            isManagerRoute && user && ["manager", "admin"].includes(user.role);

        const result = await ProductService.getAllProducts(
            filter,
            page,
            limit,
            includeInactive
        );

        res.status(200).json(result);
    } catch (error) {
        logger.error("Error fetching products", error);
        res.status(500).json({ message: "Error fetching products", error });
    }
};

export const getProductById: RequestHandler = async (req, res) => {
    try {
        const id = getString(req.params.id);
        const user = (req as any).user;

        if (!id) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }

        const includeInactive = user && ["manager", "admin"].includes(user.role);

        const product = await ProductService.getProductById(id, includeInactive);

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

export const updateProduct: RequestHandler = async (req, res) => {
    try {
        const id = getString(req.params.id);

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

export const deleteProduct: RequestHandler = async (req, res) => {
    try {
        const id = getString(req.params.id);

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

export const getSimilarProducts: RequestHandler = async (req, res) => {
    try {
        const id = getString(req.params.id);
        const limit = getNumber(req.query.limit, 6);

        const products = await ProductService.getSimilarProducts(id, limit);
        res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching similar products", error);
        res.status(500).json({ message: "Error fetching similar products", error });
    }
};

export const getTopProducts: RequestHandler = async (req, res) => {
    try {
        const limit = getNumber(req.query.limit, 10);

        const products = await ProductService.getTopProducts(limit);
        res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching top products", error);
        res.status(500).json({ message: "Error fetching top products", error });
    }
};

export const getAnalyticsProducts: RequestHandler = async (_req, res) => {
    try {
        const products = await ProductService.getAnalyticsProducts();
        res.status(200).json(products);
    } catch (error) {
        logger.error("Error fetching analytics products", error);
        res.status(500).json({ message: "Error fetching analytics products", error });
    }
};

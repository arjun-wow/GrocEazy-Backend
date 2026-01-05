import Product, { type IProduct } from "../models/Product.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import CartItem from "../models/Cart.js";
import WishlistItem from "../models/Wishlist.js";
import type { CreateProductInput, UpdateProductInput, GetProductsQuery } from "../validators/product.validators.js";

class ProductService {
    async createProduct(data: CreateProductInput, files?: Express.Multer.File[]): Promise<IProduct> {
        const imageUrls: string[] = [];

        if (files && files.length > 0) {
            for (const file of files) {
                // When using multer-storage-cloudinary, file.path is the remote URL
                imageUrls.push(file.path);
            }
        }

        const product = new Product({
            ...data,
            images: imageUrls,
        });

        return await product.save();
    }

    async getAllProducts(filter: GetProductsQuery, page?: number, limit?: number, includeInactive: boolean = false) {
        const query: any = { isDeleted: false };
        if (!includeInactive) {
            query.isActive = true;
        }

        const categoryId = filter.categoryId || filter.category;
        if (categoryId) {
            query.categoryId = categoryId;
        }

        if (filter.dietary) {
            query.dietary = filter.dietary;
        }

        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
            query.price = {};
            if (filter.minPrice !== undefined) query.price.$gte = Number(filter.minPrice);
            if (filter.maxPrice !== undefined) query.price.$lte = Number(filter.maxPrice);
        }

        if (filter.search) {
            query.$text = { $search: filter.search };
        }

        if (filter.isActive !== undefined) {
            query.isActive = filter.isActive;
        }

        if (filter.stockStatus) {
            switch (filter.stockStatus) {
                case 'outOfStock':
                    query.stock = { $lte: 0 };
                    break;
                case 'lowStock':
                    query.$and = [
                        { stock: { $gt: 0 } },
                        { $expr: { $lte: ["$stock", "$lowStockThreshold"] } }
                    ];
                    break;
                case 'inStock':
                    query.$expr = { $gt: ["$stock", "$lowStockThreshold"] };
                    break;
            }
        }

        const sortOptions: any = {};
        if (filter.sortBy === 'price_asc') sortOptions.price = 1;
        else if (filter.sortBy === 'price_desc') sortOptions.price = -1;
        else if (filter.sortBy === 'newest') sortOptions.createdAt = -1;
        else sortOptions.createdAt = -1; // Default to newest

        const skip = page && limit ? (page - 1) * limit : 0;

        let findQuery = Product.find(query)
            .sort(sortOptions);

        if (limit) {
            findQuery = findQuery.skip(skip).limit(limit);
        }

        const [products, total] = await Promise.all([
            findQuery.populate("categoryId", "name").lean(),
            Product.countDocuments(query)
        ]);

        return {
            products,
            total,
            page: page || 1,
            limit: limit || total,
            pages: limit ? Math.ceil(total / limit) : 1
        };
    }

    async getProductById(id: string, includeInactive: boolean = false): Promise<IProduct | null> {
        const query: any = { _id: id, isDeleted: false };
        if (!includeInactive) {
            query.isActive = true;
        }
        return await Product.findOne(query).populate("categoryId", "name");
    }

    async updateProduct(id: string, data: UpdateProductInput, files?: Express.Multer.File[]): Promise<IProduct | null> {
        const updateData: any = { ...data };

        if (files && files.length > 0) {
            const imageUrls: string[] = [];
            for (const file of files) {
                // When using multer-storage-cloudinary, file.path is the remote URL
                imageUrls.push(file.path);
            }
            // logic to append or replace images? 
            // User didn't specify. I'll assume append for now or replace if "images" field passed in body is handled separately.
            // Easiest is to add to existing. 
            // But commonly updates might want to replace. 
            // For now, I'll just $push new images if any are uploaded. 
            // To manage deletions, user would pass filtered list of old images back (if I implemented removeImage).

            // Let's assume if images uploaded, we add them. 
            // If client wants to remove, they should probably call a separate endpoint or pass remaining images in a list?
            // For simplicity in this iteration: I will push new images.
            updateData.$push = { images: { $each: imageUrls } };
        }

        return await Product.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updateData, // Note: $push is inside updateData if files exist
            { new: true }
        );
    }
    // ... rest of the file unchanged


    async deleteProduct(id: string): Promise<IProduct | null> {
        return await Product.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, isActive: false } }, // Soft remove
            { new: true }
        );
    }

    async getSimilarProducts(id: string, limit: number = 6): Promise<IProduct[]> {
        const product = await Product.findById(id);
        if (!product) return [];

        return await Product.find({
            categoryId: product.categoryId,
            _id: { $ne: id }, // Exclude current product
            isDeleted: false,
            isActive: true
        })
            .limit(limit)
            .populate("categoryId", "name");
    }

    async getTopProducts(limit: number = 10): Promise<IProduct[]> {
        // Logic: "Low stock high sales" -> Products with lowest stock are assumed to be selling best
        return await Product.find({
            isDeleted: false,
            isActive: true,
            stock: { $gt: 0 } // Ensure available
        })
            .sort({ stock: 1 }) // Ascending stock (lower stock first)
            .limit(limit)
            .populate("categoryId", "name");
    }
}

export default new ProductService();
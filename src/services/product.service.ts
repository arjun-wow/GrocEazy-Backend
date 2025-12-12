import Product, { type IProduct } from "../models/Product.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

interface ProductFilter {
    categoryId?: string;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    search?: string;
    dietary?: string;
}

class ProductService {
    async createProduct(data: Partial<IProduct>, files?: Express.Multer.File[]): Promise<IProduct> {
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

    async getAllProducts(filter: ProductFilter, page: number = 1, limit: number = 20) {
        const query: any = { isDeleted: false, isActive: true };

        if (filter.categoryId) {
            query.categoryId = filter.categoryId;
        }

        if (filter.dietary) {
            query.dietary = filter.dietary;
        }

        if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
            query.price = {};
            if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
            if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
        }

        if (filter.search) {
            query.$text = { $search: filter.search };
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query).skip(skip).limit(limit).populate("categoryId", "name"),
            Product.countDocuments(query)
        ]);

        return {
            products,
            total,
            page,
            pages: Math.ceil(total / limit)
        };
    }

    async getProductById(id: string): Promise<IProduct | null> {
        return await Product.findOne({ _id: id, isDeleted: false }).populate("categoryId", "name");
    }

    async updateProduct(id: string, data: Partial<IProduct>, files?: Express.Multer.File[]): Promise<IProduct | null> {
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

    async deleteProduct(id: string): Promise<IProduct | null> {
        return await Product.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true }
        );
    }
}

export default new ProductService();

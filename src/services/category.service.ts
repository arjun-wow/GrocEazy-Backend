import Category, { type ICategory } from "../models/Category.js";
import Product from "../models/Product.js";

class CategoryService {
    async createCategory(data: Partial<ICategory>): Promise<ICategory> {
        const category = new Category(data);
        return await category.save();
    }

    async getAllCategories(search?: string, page: number = 1, limit: number = 20, sortBy?: string) {
        const query: any = { isDeleted: false };
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const skip = (page - 1) * limit;
        const sortOptions: any = {};
        if (sortBy === 'name_asc') sortOptions.name = 1;
        else if (sortBy === 'name_desc') sortOptions.name = -1;
        else if (sortBy === 'oldest') sortOptions.createdAt = 1;
        else sortOptions.createdAt = -1; // Default to newest

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query)
        ]);

        // Add product counts
        const categoryIds = categories.map(c => c._id);
        const counts = await Product.aggregate([
            { $match: { categoryId: { $in: categoryIds }, isDeleted: false } },
            { $group: { _id: "$categoryId", count: { $sum: 1 } } }
        ]);

        const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
        const categoriesWithCounts = categories.map(c => ({
            ...c,
            productCount: countMap[c._id.toString()] || 0
        }));

        return {
            categories: categoriesWithCounts,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
    }

    async getCategoryById(id: string): Promise<ICategory | null> {
        return await Category.findOne({ _id: id, isDeleted: false });
    }

    async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
        return await Category.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: data },
            { new: true }
        );
    }

    async deleteCategory(id: string): Promise<ICategory | null> {
        // Soft delete
        return await Category.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true }
        );
    }
}

export default new CategoryService();

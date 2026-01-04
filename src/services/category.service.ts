import Category, { type ICategory } from "../models/Category.js";

class CategoryService {
    async createCategory(data: Partial<ICategory>): Promise<ICategory> {
        const category = new Category(data);
        return await category.save();
    }

    async getAllCategories(search?: string, page: number = 1, limit: number = 20) {
        const query: any = { isDeleted: false };
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query)
        ]);

        return {
            categories,
            total,
            page,
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

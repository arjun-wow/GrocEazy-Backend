import Category, { type ICategory } from "../models/Category.js";

class CategoryService {
    async createCategory(data: Partial<ICategory>): Promise<ICategory> {
        const category = new Category(data);
        return await category.save();
    }

    async getAllCategories(): Promise<ICategory[]> {
        // Return all non-deleted categories
        return await Category.find({ isDeleted: false });
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

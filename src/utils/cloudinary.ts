import { v2 as cloudinary } from 'cloudinary';
import { unlink } from 'fs/promises';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export default cloudinary;

export const uploadToCloudinary = async (filePath: string, folder: string = 'groceazy'): Promise<{ url: string; publicId: string }> => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
        });
        // Remove file from local storage after upload
        await unlink(filePath);
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        // Attempt to remove file even if upload fails
        try {
            await unlink(filePath);
        } catch (e) {
            console.error("Error deleting local file after failed upload:", e);
        }
        throw error;
    }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        throw error;
    }
};

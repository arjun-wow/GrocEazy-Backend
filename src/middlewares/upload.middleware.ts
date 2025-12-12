import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "groceazy",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
    } as any, // Type assertion needed because types might not be perfectly aligned or updated
});

export const upload = multer({ storage: storage });

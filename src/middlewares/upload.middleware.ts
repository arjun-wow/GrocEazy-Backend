import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "groceazy",
        allowedFormats: ["jpg", "png", "jpeg", "webp"],
    } as any, // keeping as any locally for now if types are completely broken, but let's try to fix it properly if possible. 
    // Actually, `allowedFormats` is the v4 property. 
    // If I remove `as any`, I might get type errors if the @types package is outdated. 
    // Let's try to remove `as any` and see if it compiles. If not, I'll add it back but with the correct property.
});

export const upload = multer({ storage: storage });

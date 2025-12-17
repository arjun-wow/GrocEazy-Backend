
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUrl = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/groceazy";

const schema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    addresses: [{
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        isDefault: Boolean
    }]
}, { strict: false, timestamps: true });

const User = mongoose.model('User', schema);

async function runTest() {
    try {
        console.log("Connecting to:", mongoUrl);
        await mongoose.connect(mongoUrl);

        const user = await User.findOne({});
        if (!user) { console.log("No user"); return; }

        console.log(`User: ${user.email}, Old Phone: ${user.phone}`);

        // Manual Update Test (Functionally equivalent to service)
        const newPhone = "+Test" + Math.floor(Math.random() * 1000);
        user.phone = newPhone;
        await user.save();

        const check = await User.findById(user._id);
        if (check.phone === newPhone) {
            console.log("SUCCESS: Phone persisted.");
        } else {
            console.log("FAILURE: Phone NOT persisted.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
runTest();

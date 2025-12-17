import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUrl = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/groceazy";

const schema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    addresses: []
}, { strict: false });

// Register model if not exists (checked via models check, but here we just create fresh connection)
const User = mongoose.model('User', schema);

async function run() {
    try {
        console.log("Connecting to:", mongoUrl);
        await mongoose.connect(mongoUrl);
        const users = await User.find({});
        console.log(`Found ${users.length} users`);
        users.forEach(u => {
            console.log(`User: ${u.email}, Phone: '${u.phone}', Addresses: ${JSON.stringify(u.addresses)}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
run();

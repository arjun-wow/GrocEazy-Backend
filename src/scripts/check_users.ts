
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';

dotenv.config();

const mongoUrl = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/groceazy"; // Fallback to local if not valid

async function checkUsers() {
    try {
        console.log("Connecting to DB:", mongoUrl);
        await mongoose.connect(mongoUrl);
        console.log("Connected.");

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        users.forEach(u => {
            console.log("---------------------------------------------------");
            console.log(`User: ${u.email} (ID: ${u._id})`);
            console.log(`Name: ${u.name}`);
            console.log(`Phone (DB): '${u.phone}'`); // Quote to see empty string vs undefined
            console.log(`Addresses (DB):`, JSON.stringify(u.addresses, null, 2));
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();

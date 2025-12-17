
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as userService from '../services/user.service.js';
import { User } from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoUrl = process.env.MONGO_DB_URL || "mongodb://127.0.0.1:27017/groceazy";

async function runTest() {
    try {
        console.log("Connecting to:", mongoUrl);
        await mongoose.connect(mongoUrl);

        // 1. Find a test user (or first user)
        const user = await User.findOne({});
        if (!user) {
            console.log("No user found to test.");
            return;
        }
        console.log(`Testing with User: ${user.email} (${user._id})`);
        console.log(`Initial Phone: ${user.phone}`);

        // 2. Test Update Profile (Phone)
        const newPhone = "+919876543210";
        console.log(`Updating phone to: ${newPhone}`);

        await userService.updateProfile(user._id.toString(), { phone: newPhone });

        // 3. Verify in DB immediately
        const userRefetched = await User.findById(user._id);
        if (userRefetched?.phone === newPhone) {
            console.log("SUCCESS: Phone updated and persisted.");
        } else {
            console.error(`FAILURE: Phone not saved. Found: ${userRefetched?.phone}`);
        }

        // 4. Test Add Address
        const newAddress = {
            street: "Test St",
            city: "Test City",
            state: "TS",
            zipCode: "12345",
            country: "Testland",
            isDefault: true
        };
        console.log("Adding address...");
        await userService.addAddress(user._id.toString(), newAddress);

        const userWithAddress = await User.findById(user._id);
        const addedAddr = userWithAddress?.addresses.find(a => a.city === "Test City");

        if (addedAddr) {
            console.log("SUCCESS: Address added and persisted.");
        } else {
            console.error("FAILURE: Address not saved.");
        }

    } catch (e) {
        console.error("Test Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();

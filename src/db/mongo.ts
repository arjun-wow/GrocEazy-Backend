// src/db/mongo.ts
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import mongoose from "mongoose";
import config from "../config/index.js";

export async function connectMongo() {
  try {
    const mongoUrl = config.mongoUri || process.env.MONGO_DB_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_DB_URL (or config.mongoUri) environment variable is not defined");
    }

    const conn = await mongoose.connect(mongoUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
    } else {
      console.error(`Error connecting to MongoDB: ${String(error)}`);
    }
    process.exit(1);
  }
}

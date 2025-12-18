import { createApp } from "../src/app.js";
import { connectMongo } from "../src/db/mongo.js";

const app = createApp();

// Initialize DB connection once (serverless containers might reuse this)
connectMongo();

export default app;

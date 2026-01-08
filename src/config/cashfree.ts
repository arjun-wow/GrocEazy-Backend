import { Cashfree } from "cashfree-pg";
import dotenv from "dotenv";

dotenv.config();

// Initialize Cashfree instance using the constructor
// Use 'any' cast for constructor if types are missing static properties/definitions for v5
const cashfree = new (Cashfree as any)({
  xClientId: process.env.CASHFREE_APP_ID || "",
  xClientSecret: process.env.CASHFREE_SECRET_KEY || "",
  xEnvironment: process.env.CASHFREE_MODE === "PRODUCTION" 
    ? "PRODUCTION" 
    : "SANDBOX"
});

export default cashfree;

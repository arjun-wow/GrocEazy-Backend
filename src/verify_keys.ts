import { Cashfree } from "cashfree-pg";
import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from current directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const appId = process.env.CASHFREE_APP_ID || "";
const secret = process.env.CASHFREE_SECRET_KEY || "";
const mode = process.env.CASHFREE_MODE || "SANDBOX";

console.log("\n=== CASHFREE CONFIGURATION CHECK ===");
console.log(`Current Directory: ${process.cwd()}`);
console.log(`Mode: ${mode}`);
console.log(`App ID: ${appId.substring(0, 5)}... (Length: ${appId.length})`);
console.log(`Secret: ${secret ? "Present" : "Missing"} (Length: ${secret.length})`);

if (!appId || !secret) {
    console.error("❌ ERROR: Missing App ID or Secret Key in .env file");
    process.exit(1);
}

// Initialize
try {
    // Use correct instance-based initialization
    const cashfree = new (Cashfree as any)({
       xClientId: appId,
       xClientSecret: secret,
       xEnvironment: mode === "PRODUCTION" ? "PRODUCTION" : "SANDBOX"
    });

    console.log("SDK Initialized. Attempting dummy request...");

    const request = {
        order_amount: 1.00,
        order_currency: "INR",
        customer_details: {
            customer_id: "test_user_verify",
            customer_name: "Test User",
            customer_email: "test@example.com",
            customer_phone: "9999999999"
        },
        order_meta: {
            return_url: "http://localhost:3000/return"
        },
        order_id: "verify_" + Date.now()
    };

    // Use instance method
    (cashfree as any).PGCreateOrder(request)
        .then((response: any) => {
            console.log("\n✅ SUCCESS! Order created successfully.");
            console.log("Payment Session ID:", response.data.payment_session_id);
            console.log("\n>>> YOUR KEYS ARE VALID <<<");
        })
        .catch((error: any) => {
            console.error("\n❌ FAILED: API Call rejected.");
            if (error.response) {
                console.error(`Status: ${error.response.status}`);
                console.error("Message:", error.response.data?.message);
                if (error.response.data?.type) console.error("Type:", error.response.data.type);
                if (error.response.data?.code) console.error("Code:", error.response.data.code);
            } else {
                console.error("Error:", error.message);
            }
            console.log("\nPossible Causes:");
            console.log("1. Wrong keys (Production keys used in Sandbox mode or vice versa)");
            console.log("2. Invalid characters in keys (check for spaces)");
            console.log("3. IP Whitelisting (if enabled in dashboard)");
        });

} catch (err: any) {
    console.error("❌ SDK Initialization Error:", err.message);
}

// ------------------------------------------------------------------
// RAW HTTP CHECK (Bypassing SDK to rule out library issues)
// ------------------------------------------------------------------
import axios from "axios";

console.log("\n--- STARTING RAW HTTP CHECK ---");

const RAW_URL = mode === "PRODUCTION" 
    ? "https://api.cashfree.com/pg/orders" 
    : "https://sandbox.cashfree.com/pg/orders";

const rawRequest = {
    order_amount: 1.00,
    order_currency: "INR",
    customer_details: {
        customer_id: "test_raw_" + Date.now(),
        customer_name: "Raw Test",
        customer_email: "raw@example.com",
        customer_phone: "9999999999"
    },
    order_meta: {
        return_url: "http://localhost:3000/return"
    }
};

const headers = {
    "x-client-id": appId,
    "x-client-secret": secret,
    "x-api-version": "2023-08-01", // Explicit version
    "Content-Type": "application/json"
};

console.log(`Endpoint: ${RAW_URL}`);
console.log("Sending Raw Axios Request...");

axios.post(RAW_URL, rawRequest, { headers })
    .then(res => {
         console.log("\n✅ [RAW HTTP] SUCCESS!");
         console.log("Your keys are DEFINITELY VALID.");
         console.log("Sessions ID:", res.data.payment_session_id);
    })
    .catch(err => {
        console.error("\n❌ [RAW HTTP] FAILED");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("Error:", err.message);
        }
    });

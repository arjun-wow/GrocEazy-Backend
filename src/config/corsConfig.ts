import cors, { type CorsOptions } from "cors";

const allowedOrigins = [
  "http://localhost:3000", "*",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / Postman requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

export default cors(corsOptions);

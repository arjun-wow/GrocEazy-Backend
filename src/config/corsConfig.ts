import cors, { type CorsOptions } from "cors";



const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / Postman requests
    if (!origin) return callback(null, true);

    // Allow all origins
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

export default cors(corsOptions);

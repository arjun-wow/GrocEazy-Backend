import cors, { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

export default cors(corsOptions);

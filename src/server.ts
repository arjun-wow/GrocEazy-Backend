// src/server.ts
import { createServer } from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import config from "./config/index.js";
import { SocketService } from "./services/socket.service.js";

async function main() {
  await connectMongo();
  const app = createApp();
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust as per your corsConfig if needed
      methods: ["GET", "POST"]
    }
  });

  new SocketService(io);

  httpServer.listen(config.port, () => console.log(`Server running on port ${config.port}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

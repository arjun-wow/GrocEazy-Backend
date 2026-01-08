// src/server.ts
import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import config from "./config/index.js";

async function main() {
  await connectMongo();
  const app = createApp();
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`\n\n=== SERVER RESTARTED WITH DEBUG LOGS [${new Date().toISOString()}] ===\n\n`);
    console.log(`Server running on port ${PORT}`); // Assuming logger is not defined, using console.log
    console.log(`Environment: ${process.env.NODE_ENV}`); // Assuming logger is not defined, using console.log
  });
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});

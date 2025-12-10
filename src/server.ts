// src/server.ts
import { createApp } from "./app.js";
import { connectMongo } from "./db/mongo.js";
import config from "./config/index.js";

async function main() {
  await connectMongo();
  const app = createApp();
  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});

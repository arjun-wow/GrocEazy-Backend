import express from "express";
import logger from "./config/logger.js";

const app = express();
const port = 5000;

app.get("/", (req, res) => {
  res.send("API CHECK");
});

app.listen(port, () => {
  logger.info(`Server is running on port http://localhost:${port}`);
});

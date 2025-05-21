import "dotenv/config";
import "reflect-metadata";
import express, { Express } from "express";
import "express-async-errors";
import cors from "cors";
import path from "path";
import fs from "fs";

import { router } from "./api/routes";
import { errorHandler } from "./api/middlewares/error-handler";
import { AppError } from "./shared/errors/AppError";

const UPLOAD_DIR_BASE = path.resolve(__dirname, "..", "uploads");
const UPLOAD_DIR_ORIGINALS = path.join(UPLOAD_DIR_BASE, "originals");
const UPLOAD_DIR_GENERATED = path.join(UPLOAD_DIR_BASE, "generated_pdfs");
const TEMP_UPLOAD_DIR = path.resolve(__dirname, "..", "tmp", "uploads");

[
  UPLOAD_DIR_BASE,
  UPLOAD_DIR_ORIGINALS,
  UPLOAD_DIR_GENERATED,
  TEMP_UPLOAD_DIR,
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
});

const app: Express = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server está ativo!",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1", router);

app.use((req, res, next) => {
  next(
    new AppError(`Rota não encontrada ${req.method} ${req.originalUrl}`, 404)
  );
});

app.use(errorHandler);

export { app };

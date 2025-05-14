import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { requestLogger } from "./middleware/requestLogger";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger";
import path from "path";

// Load env
dotenv.config();

export const startServer = () => {
  const app = express();
  const port = process.env.PORT || 5000;

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", message: "Server is running" });
  });

  app.use("/api/v1", apiRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../frontend/index.html"));
    });
  }

  app.listen(port, () => {
    logger.info(`⚡️ Server is running at http://localhost:${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection:", { reason, promise });
  });
};

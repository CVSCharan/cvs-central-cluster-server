import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { requestLogger } from "./middleware/requestLogger";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger";
import path from "path";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import "./config/passport"; // We'll create this file next
import { primaryConnection } from "./config/database";

// Load env
dotenv.config();

export const startServer = () => {
  const app = express();
  const port = process.env.PORT || 5000;

  app.use(helmet());
  app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Session configuration
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "cvs-central-cluster-session-secret",
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        // Use existing connection instead of creating a new one
        clientPromise: Promise.resolve(primaryConnection.getClient()),
        ttl: 14 * 24 * 60 * 60, // 14 days
        collectionName: "sessions", // Use this to specify the collection name
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      },
    })
  );

  // Initialize Passport and restore authentication state from session
  app.use(passport.initialize());
  app.use(passport.session());

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

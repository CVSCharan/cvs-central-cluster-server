import dotenv from "dotenv";
import logger from "./utils/logger";
import { startServer } from "./server";
import { primaryConnection, secondaryConnection } from "./config/database";

// Load environment variables first
dotenv.config();

// Initialize database and start server
async function initialize() {
  try {
    logger.info("Initializing application...");

    // Wait for database connections to be established
    logger.info("Connecting to databases...");

    // Create promises for database connections with timeouts
    const connectPrimary = Promise.race([
      new Promise<void>((resolve, reject) => {
        primaryConnection.once("connected", () => {
          logger.info("Primary database connected");
          resolve();
        });
        primaryConnection.once("error", (err) => {
          reject(new Error(`Primary database connection error: ${err.message}`));
        });
      }),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error("Primary database connection timeout - is MongoDB running?")), 5000)
      )
    ]);

    const connectSecondary = new Promise<void>((resolve, reject) => {
      secondaryConnection.once("connected", () => {
        logger.info("Secondary database connected");
        resolve();
      });
      secondaryConnection.once("error", (err) => {
        reject(
          new Error(`Secondary database connection error: ${err.message}`)
        );
      });
    });

    // Wait for both connections to be established
    await Promise.all([connectPrimary, connectSecondary]);

    // Start the server after all models are registered
    logger.info("Starting server...");
    startServer();
  } catch (error) {
    logger.error("Initialization failed:", {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

// Start the initialization process
initialize();

// Graceful shutdown handlers
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

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal. Shutting down gracefully...");
  try {
    await primaryConnection.close();
    await secondaryConnection.close();
    logger.info("Database connections closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown:", {
      error: (error as Error).message,
    });
    process.exit(1);
  }
});

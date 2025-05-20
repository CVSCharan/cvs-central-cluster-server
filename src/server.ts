import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes";
import { requestLogger } from "./middleware/requestLogger";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger";
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
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") || [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://cvs-central-cluster-server.onrender.com",
      ],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Session configuration
  app.use(
    session({
      secret:
        process.env.SESSION_SECRET || "cvs-central-cluster-session-secret",
      resave: false,
      saveUninitialized: true, // Keep this as true to avoid null sessionId
      store: MongoStore.create({
        // Use existing connection instead of creating a new one
        clientPromise: Promise.resolve(primaryConnection.getClient()),
        ttl: 14 * 24 * 60 * 60, // 14 days
        collectionName: "sessions", // Use this to specify the collection name
        crypto: {
          secret:
            process.env.SESSION_SECRET || "cvs-central-cluster-session-secret",
        },
        touchAfter: 24 * 3600, // Only update sessions once per day unless data changes
        autoRemove: "native", // Use MongoDB's TTL index
        autoRemoveInterval: 10, // Check expired sessions every 10 minutes
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

  // Serve static files and handle client-side routing
  if (process.env.NODE_ENV === "production") {
    // Serve a simple HTML page directly instead of looking for static files
    app.get("/", (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CVS Central Cluster API</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #eee;
              padding-bottom: 10px;
            }
            .card {
              background: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            code {
              background: #e9e9e9;
              padding: 2px 5px;
              border-radius: 3px;
              font-family: monospace;
            }
            .endpoint {
              margin: 10px 0;
              padding: 10px;
              background: #e9f7fe;
              border-left: 4px solid #3498db;
              border-radius: 3px;
            }
            .method {
              font-weight: bold;
              color: #3498db;
            }
          </style>
        </head>
        <body>
          <h1>CVS Central Cluster API</h1>
          <div class="card">
            <h2>API Status</h2>
            <p>The API server is running successfully.</p>
            <div class="endpoint">
              <span class="method">GET</span> <code>/api/health</code> - Check API health status
            </div>
          </div>
          <div class="card">
            <h2>API Documentation</h2>
            <p>Available endpoints:</p>
            <div class="endpoint">
              <span class="method">GET</span> <code>/api/v1/users/me</code> - Get current user (requires authentication)
            </div>
            <div class="endpoint">
              <span class="method">POST</span> <code>/api/v1/auth/login</code> - User login
            </div>
          </div>
          <footer>
            <p>© ${new Date().getFullYear()} CVS Central Cluster API</p>
          </footer>
        </body>
        </html>
      `);
    });
  } else {
    // Development welcome page
    app.get("/", (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CVS Central Cluster API - Development</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 2rem;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #eee;
              padding-bottom: 10px;
            }
            .dev-badge {
              display: inline-block;
              background: #ff6b6b;
              color: white;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 0.8rem;
              margin-left: 10px;
              vertical-align: middle;
            }
            .card {
              background: white;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            code {
              background: #e9e9e9;
              padding: 2px 5px;
              border-radius: 3px;
              font-family: monospace;
            }
            .endpoint {
              margin: 10px 0;
              padding: 10px;
              background: #e9f7fe;
              border-left: 4px solid #3498db;
              border-radius: 3px;
            }
            .method {
              font-weight: bold;
              color: #3498db;
            }
          </style>
        </head>
        <body>
          <h1>CVS Central Cluster API <span class="dev-badge">DEV</span></h1>
          <div class="card">
            <h2>Development Server</h2>
            <p>The API server is running in development mode.</p>
            <div class="endpoint">
              <span class="method">GET</span> <code>/api/health</code> - Check API health status
            </div>
          </div>
          <div class="card">
            <h2>API Documentation</h2>
            <p>Available endpoints:</p>
            <div class="endpoint">
              <span class="method">GET</span> <code>/api/v1/users/me</code> - Get current user (requires authentication)
            </div>
            <div class="endpoint">
              <span class="method">POST</span> <code>/api/v1/auth/login</code> - User login
            </div>
          </div>
          <footer>
            <p>© ${new Date().getFullYear()} CVS Central Cluster API - Development Environment</p>
          </footer>
        </body>
        </html>
      `);
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

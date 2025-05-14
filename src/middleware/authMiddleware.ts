import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/primary/User";
import { TokenPayload } from "../services/userService";
import logger from "../utils/logger";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Verify JWT token middleware
export const auth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Authentication failed: No token provided");
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-default-secret"
    ) as TokenPayload;

    // Find user by ID
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      logger.warn("Authentication failed: User not found", {
        userId: decoded.userId,
      });
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    // Add user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    logger.error("Authentication error", { error: (error as Error).message });
    res.status(401).json({ message: "Authentication failed" });
    return;
  }
};

// Admin role middleware
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isAdmin) {
    logger.warn("Authorization failed: Admin access required", {
      userId: req.user?._id,
    });
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  next();
};

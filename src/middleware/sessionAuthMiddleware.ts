import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

// Session authentication middleware
export const sessionAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  logger.warn("Session authentication failed");
  res.status(401).json({ message: "Authentication required" });
};
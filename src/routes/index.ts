import express from "express";
import userRoutes from "./userRoutes";
import projectRoutes from "./projectRoutes";
import testimonialRoutes from "./testimonialRoutes";

const router = express.Router();

// Register routes
router.use("/auth", userRoutes);
router.use("/projects", projectRoutes);
router.use("/testimonials", testimonialRoutes);

// API health check route
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

export default router;

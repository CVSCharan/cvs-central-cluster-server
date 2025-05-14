import express from "express";
import testimonialController from "../controllers/testimonialController";
import { auth, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.get("/", testimonialController.getAllTestimonials);
router.get("/approved", testimonialController.getAllTestimonials);
router.get("/:id", testimonialController.getTestimonialById);

// Protected routes (require authentication)
router.post("/", auth, testimonialController.createTestimonial);
router.get("/user/me", auth, testimonialController.getUserTestimonials);
router.put("/:id", auth, testimonialController.updateTestimonial);
router.delete("/:id", auth, testimonialController.deleteTestimonial);

// Admin routes
router.get(
  "/admin/all",
  auth,
  adminOnly,
  testimonialController.getAllTestimonialsAdmin
);
router.put(
  "/admin/:id/moderate",
  auth,
  adminOnly,
  testimonialController.moderateTestimonial
);

export default router;

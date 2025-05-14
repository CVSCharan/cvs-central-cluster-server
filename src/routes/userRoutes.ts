import express from "express";
import userController from "../controllers/userController";
import { auth, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/verify/:token", userController.verifyEmail);
router.post("/forgot-password", userController.requestPasswordReset);
router.post("/reset-password/:token", userController.resetPassword);

// Protected routes (require authentication)
router.get("/me", auth, userController.getCurrentUser);
router.put("/profile", auth, userController.updateProfile);
router.post("/change-password", auth, userController.changePassword);
router.delete("/account", auth, userController.deleteAccount);

// Admin routes
router.get("/admin/users", auth, adminOnly, userController.getAllUsers);
router.get("/admin/users/:id", auth, adminOnly, userController.getUserById);
router.put("/admin/users/:id", auth, adminOnly, userController.adminUpdateUser);
router.delete(
  "/admin/users/:id",
  auth,
  adminOnly,
  userController.adminDeleteUser
);

export default router;

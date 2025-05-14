import { Request, Response } from "express";
import userService from "../services/userService";
import logger from "../utils/logger";
import { User } from "../models/primary/User";

class UserController {
  // Register new user
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, password, picture } = req.body;

      // Validate input
      if (!email || !name || !password) {
        res.status(400).json({ message: "Please provide all required fields" });
      }

      const user = await userService.register({
        email,
        name,
        password,
        picture,
      });

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: userResponse,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Email already in use") {
        res.status(400).json({ message: errorMessage });
      }

      logger.error("Registration error", { error: errorMessage });
      res.status(500).json({ message: "Server error during registration" });
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ message: "Please provide email and password" });
      }

      const { user, token } = await userService.login({ email, password });

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        message: "Login successful",
        user: userResponse,
        token,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage === "Invalid credentials" ||
        errorMessage === "Please verify your email before logging in" ||
        errorMessage.includes("Please login using your")
      ) {
        res.status(400).json({ message: errorMessage });
      }

      logger.error("Login error", { error: errorMessage });
      res.status(500).json({ message: "Server error during login" });
    }
  }

  // Verify email
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ message: "Verification token is required" });
      }

      await userService.verifyEmail(token);

      res
        .status(200)
        .json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Invalid verification token") {
        res.status(400).json({ message: errorMessage });
      }

      logger.error("Email verification error", { error: errorMessage });
      res
        .status(500)
        .json({ message: "Server error during email verification" });
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
      }

      await userService.requestPasswordReset(email);

      // Always return success even if email doesn't exist (security best practice)
      res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link",
      });
    } catch (error) {
      logger.error("Password reset request error", {
        error: (error as Error).message,
      });
      // Don't expose error details to client
      res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link",
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!token || !password) {
        res
          .status(400)
          .json({ message: "Token and new password are required" });
      }

      await userService.resetPassword(token, password);

      res.status(200).json({
        message:
          "Password reset successful. You can now log in with your new password.",
      });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "Invalid or expired reset token") {
        res.status(400).json({ message: errorMessage });
      }

      logger.error("Password reset error", { error: errorMessage });
      res.status(500).json({ message: "Server error during password reset" });
    }
  }

  // Get current user profile
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // User is already attached to req by auth middleware
      res.status(200).json({ user: req.user });
    } catch (error) {
      logger.error("Get current user error", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error fetching user profile" });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { name, picture } = req.body;

      const updatedUser = await userService.updateProfile(userId, {
        name,
        picture,
      });

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      logger.error("Update profile error", { error: (error as Error).message });
      res.status(500).json({ message: "Server error updating profile" });
    }
  }

  // Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }

      await userService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        errorMessage === "Current password is incorrect" ||
        errorMessage === "Invalid operation for this account type"
      ) {
        res.status(400).json({ message: errorMessage });
      }

      logger.error("Change password error", { error: errorMessage });
      res.status(500).json({ message: "Server error changing password" });
    }
  }

  // Delete account
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;

      await userService.deleteAccount(userId);

      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      logger.error("Delete account error", { error: (error as Error).message });
      res.status(500).json({ message: "Server error deleting account" });
    }
  }

  // Admin: Get all users
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select("-password");

      res.status(200).json({ users });
    } catch (error) {
      logger.error("Get all users error", { error: (error as Error).message });
      res.status(500).json({ message: "Server error fetching users" });
    }
  }

  // Admin: Get user by ID
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({ user });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "User not found") {
        res.status(404).json({ message: errorMessage });
      }

      logger.error("Get user by ID error", { error: errorMessage });
      res.status(500).json({ message: "Server error fetching user" });
    }
  }

  // Admin: Update user
  async adminUpdateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, picture, role, isAdmin, isVerified } = req.body;

      // Find user
      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Update fields
      if (name) user.name = name;
      if (picture) user.picture = picture;
      if (role) user.role = role;
      if (isAdmin !== undefined) user.isAdmin = isAdmin;
      if (isVerified !== undefined) user.isVerified = isVerified;

      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        message: "User updated successfully",
        user: userResponse,
      });
    } catch (error) {
      logger.error("Admin update user error", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error updating user" });
    }
  }

  // Admin: Delete user
  async adminDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await User.findByIdAndDelete(id);
      if (!result) {
        res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      logger.error("Admin delete user error", {
        error: (error as Error).message,
      });
      res.status(500).json({ message: "Server error deleting user" });
    }
  }
}

export default new UserController();

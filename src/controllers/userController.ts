import { Request, Response } from "express";
import userService from "../services/userService";
import logger from "../utils/logger";
import { IUser, User } from "../models/primary/User";
import jwt from "jsonwebtoken";

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
      const user = await User.findById(req.user._id).select("-password");

      if (!user) {
        logger.warn("User not found for token", {
          userId: req.user._id,
        });
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }
      // User is already attached to req by auth middleware
      res.status(200).json({
        success: true,
        token: req.token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          isAdmin: user.isAdmin,
        },
      });
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

  // Google Login
  async googleLogin(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("Initiating Google login flow");
      const authUrl = await userService.getGoogleOAuthUrl("login");
      res.redirect(authUrl);
    } catch (error) {
      logger.error("Error initiating Google login flow", {
        error: (error as Error).message,
      });
      res.status(500).json({
        success: false,
        message: "Server Error",
        error: (error as Error).message,
      });
    }
  }

  // Google Registration
  async googleRegister(_req: Request, res: Response): Promise<void> {
    try {
      logger.info("Initiating Google registration flow");
      const authUrl = await userService.getGoogleOAuthUrl("register");
      res.redirect(authUrl);
    } catch (error) {
      logger.error("Error initiating Google registration flow", {
        error: (error as Error).message,
      });
      res.status(500).json({
        success: false,
        message: "Server Error",
        error: (error as Error).message,
      });
    }
  }

  // Google Callback - Now using Passport
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      logger.info("Processing Google OAuth callback", {
        callbackUrl: req.originalUrl,
        headers: req.headers.host,
      });
      const user = req.user as IUser;

      if (!user) {
        throw new Error("Authentication failed");
      }

      // Generate JWT token for API access
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1d" }
      );

      logger.info(`Google authentication successful for user: ${user.email}`);

      // Ensure token is properly encoded for URL
      const encodedToken = encodeURIComponent(token);
      // Redirect with token as query parameter
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/success?token=${encodedToken}`;
      logger.debug(`Redirecting to: ${redirectUrl}`);

      res.redirect(redirectUrl);
    } catch (error) {
      logger.error("Google OAuth callback error:", {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      const errorMessage = encodeURIComponent((error as Error).message);
      // Redirect with error message as query parameter
      res.redirect(
        `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/auth/error?message=${errorMessage}`
      );
    }
  }

  // Update logout to handle both session and JWT
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear session
      req.logout((err) => {
        if (err) {
          logger.error("Error during logout", { error: err.message });
        }
      });

      // Clear JWT cookie if it exists
      res.clearCookie("token");

      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      logger.error("Logout error", { error: (error as Error).message });
      res.status(500).json({ message: "Server error during logout" });
    }
  }

  // Set password for OAuth user
  async setPasswordForOAuthUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user._id;
      const { password } = req.body;

      if (!password) {
        res.status(400).json({ message: "Password is required" });
        return;
      }

      await userService.setPasswordForOAuthUser(userId, password);

      res.status(200).json({ message: "Password set successfully" });
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (errorMessage === "User already has a password") {
        res.status(400).json({ message: errorMessage });
        return;
      }

      logger.error("Set password for OAuth user error", {
        error: errorMessage,
      });
      res.status(500).json({ message: "Server error setting password" });
    }
  }
}

export default new UserController();

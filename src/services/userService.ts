import { User, IUser } from "../models/primary/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import logger from "../utils/logger";

export interface UserRegistrationData {
  email: string;
  name: string;
  password: string;
  picture?: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

class UserService {
  // Register a new user
  async register(userData: UserRegistrationData): Promise<IUser> {
    try {
      logger.info("Registering new user", { email: userData.email });

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        logger.warn("Registration failed: Email already in use", {
          email: userData.email,
        });
        throw new Error("Email already in use");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create new user
      const user = new User({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        picture: userData.picture,
        provider: "local",
        verificationToken,
        isVerified: false,
      });

      await user.save();
      logger.info("User registered successfully", { userId: user._id });

      return user;
    } catch (error) {
      logger.error("Error registering user", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Login user
  async login(
    loginData: UserLoginData
  ): Promise<{ user: IUser; token: string }> {
    try {
      logger.info("User login attempt", { email: loginData.email });

      // Find user by email
      const user = await User.findOne({ email: loginData.email });
      if (!user) {
        logger.warn("Login failed: Invalid credentials", {
          email: loginData.email,
        });
        throw new Error("Invalid credentials");
      }

      // Check if user is using local authentication
      if (user.provider !== "local") {
        logger.warn("Login failed: Please login using your provider", {
          email: loginData.email,
          provider: user.provider,
        });
        throw new Error(`Please login using your ${user.provider} account`);
      }

      // Verify password
      if (!user.password) {
        logger.error("Login failed: User has no password", {
          email: loginData.email,
        });
        throw new Error("Invalid credentials");
      }

      const isMatch = await bcrypt.compare(loginData.password, user.password);
      if (!isMatch) {
        logger.warn("Login failed: Invalid password", {
          email: loginData.email,
        });
        throw new Error("Invalid credentials");
      }

      // Check if user is verified (for local accounts)
      if (!user.isVerified) {
        logger.warn("Login failed: Account not verified", {
          email: loginData.email,
        });
        throw new Error("Please verify your email before logging in");
      }

      // Generate JWT token
      const payload: TokenPayload = {
        userId: user._id?.toString() || user.id || "",
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your-default-secret",
        { expiresIn: "1d" }
      );

      logger.info("User logged in successfully", { userId: user._id });
      return { user, token };
    } catch (error) {
      logger.error("Error during login", { error: (error as Error).message });
      throw error;
    }
  }

  // Verify user email
  async verifyEmail(token: string): Promise<IUser> {
    try {
      logger.info("Verifying user email");

      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        logger.warn("Email verification failed: Invalid token");
        throw new Error("Invalid verification token");
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      logger.info("Email verified successfully", { userId: user._id });
      return user;
    } catch (error) {
      logger.error("Error verifying email", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(
    email: string
  ): Promise<{ user: IUser; token: string }> {
    try {
      logger.info("Password reset requested", { email });

      const user = await User.findOne({ email });
      if (!user) {
        logger.warn("Password reset failed: User not found", { email });
        throw new Error("User not found");
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetPasswordToken = resetToken;

      // Set token expiration (1 hour)
      const resetPasswordExpires = new Date(Date.now() + 3600000);

      // Update user with reset token info
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      logger.info("Password reset token generated", { userId: user._id });
      return { user, token: resetToken };
    } catch (error) {
      logger.error("Error requesting password reset", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<IUser> {
    try {
      logger.info("Resetting password");

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        logger.warn("Password reset failed: Invalid or expired token");
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      logger.info("Password reset successful", { userId: user._id });
      return user;
    } catch (error) {
      logger.error("Error resetting password", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId: string): Promise<IUser> {
    try {
      logger.info("Fetching user by ID", { userId });

      const user = await User.findById(userId).select("-password");
      if (!user) {
        logger.warn("User not found", { userId });
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      logger.error("Error fetching user", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser> {
    try {
      logger.info("Updating user profile", { userId });

      // Prevent updating sensitive fields
      const allowedUpdates = ["name", "picture"];
      const updates: Partial<IUser> = {};

      Object.keys(updateData).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          (updates as any)[key] = (updateData as any)[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        logger.warn("Profile update failed: User not found", { userId });
        throw new Error("User not found");
      }

      logger.info("User profile updated successfully", { userId });
      return user;
    } catch (error) {
      logger.error("Error updating user profile", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // Change password
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<IUser> {
    try {
      logger.info("Changing user password", { userId });

      const user = await User.findById(userId);
      if (!user) {
        logger.warn("Password change failed: User not found", { userId });
        throw new Error("User not found");
      }

      // Verify current password
      if (!user.password) {
        logger.error("Password change failed: User has no password", {
          userId,
        });
        throw new Error("Invalid operation for this account type");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        logger.warn("Password change failed: Current password is incorrect", {
          userId,
        });
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      user.password = hashedPassword;
      await user.save();

      logger.info("Password changed successfully", { userId });
      return user;
    } catch (error) {
      logger.error("Error changing password", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    try {
      logger.info("Deleting user account", { userId });

      const result = await User.findByIdAndDelete(userId);
      if (!result) {
        logger.warn("Account deletion failed: User not found", { userId });
        throw new Error("User not found");
      }

      logger.info("User account deleted successfully", { userId });
    } catch (error) {
      logger.error("Error deleting user account", {
        error: (error as Error).message,
        userId,
      });
      throw error;
    }
  }

  // OAuth authentication (Google, GitHub)
  async oauthLogin(
    profile: any,
    provider: "google" | "github"
  ): Promise<{ user: IUser; token: string }> {
    try {
      logger.info(`${provider} OAuth login`, { email: profile.email });

      // Find user by email
      let user = await User.findOne({ email: profile.email });

      if (user) {
        // If user exists but used different provider
        if (user.provider !== provider) {
          logger.info("User exists with different provider", {
            email: profile.email,
            existingProvider: user.provider,
            newProvider: provider,
          });

          // Update provider if it was local and not verified
          if (user.provider === "local" && !user.isVerified) {
            user.provider = provider;
            user.providerId = profile.id;
            user.isVerified = true;
            user.verificationToken = undefined;
            await user.save();
          } else {
            logger.warn(
              "OAuth login failed: Account exists with different provider",
              {
                email: profile.email,
                provider: user.provider,
              }
            );
            throw new Error(
              `You already have an account with ${user.provider}. Please sign in with that provider.`
            );
          }
        }
      } else {
        // Create new user if doesn't exist
        user = new User({
          email: profile.email,
          name: profile.name,
          picture: profile.picture || undefined,
          provider,
          providerId: profile.id,
          isVerified: true,
        });

        await user.save();
        logger.info("New user created via OAuth", {
          userId: user._id,
          provider,
        });
      }

      // Generate JWT token
      const payload: TokenPayload = {
        userId: user._id?.toString() || user.id || "",
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your-default-secret",
        { expiresIn: "1d" }
      );

      logger.info("User authenticated via OAuth", {
        userId: user._id,
        provider,
      });
      return { user, token };
    } catch (error) {
      logger.error(`Error during ${provider} OAuth login`, {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new UserService();

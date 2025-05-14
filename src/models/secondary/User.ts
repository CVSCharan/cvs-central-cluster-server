import { Schema, Document } from "mongoose";
import { secondaryConnection } from "../../config/database";

export interface IUser extends Document {
  email: string;
  name: string;
  picture: string;
  provider: "local" | "google" | "github";
  providerId?: string;
  password?: string;
  role: "user" | "admin";
  isAdmin: boolean;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    provider: {
      type: String,
      required: true,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: {
      type: String,
    },
    password: {
      type: String,
      // Required only for local authentication
      required: function () {
        return this.provider === "local";
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: function () {
        // OAuth users are considered verified
        return this.provider !== "local";
      },
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Use secondaryConnection for the secondary database
export const User = secondaryConnection.model<IUser>("User", UserSchema);

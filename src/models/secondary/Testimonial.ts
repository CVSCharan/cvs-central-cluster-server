import { Schema, Document } from "mongoose";
import { secondaryConnection } from "../../config/database";
import { User } from "./User";

export interface ITestimonial extends Document {
  user: Schema.Types.ObjectId;
  name: string;
  avatar?: string;
  content: string;
  rating: number;
  isApproved: boolean;
  position?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    position: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Important: Use secondaryConnection instead of mongoose directly
export const Testimonial = secondaryConnection.model<ITestimonial>(
  "Testimonial",
  TestimonialSchema
);

import { Schema, Document } from "mongoose";
import { primaryConnection } from "../../config/database";

export interface IProject extends Document {
  title: string;
  slug: string;
  description: string;
  fullDescription: string;
  image: string;
  technologies: string[];
  features: string[];
  liveUrl?: string;
  githubUrl?: string;
  category: "web" | "mobile" | "design" | "full-stack";
  relatedProjects?: string[];
  isActive: boolean;
  isFeatured: boolean;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    fullDescription: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    technologies: {
      type: [String],
      required: true,
    },
    features: {
      type: [String],
      required: true,
    },
    liveUrl: {
      type: String,
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["web", "mobile", "design", "full-stack"],
    },
    relatedProjects: {
      type: [String],
      default: [],
      validate: {
        validator: function (slugs: string[]) {
          // Optional: Add validation to ensure slugs are unique in the array
          return new Set(slugs).size === slugs.length;
        },
        message: "Related projects must have unique slugs",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    platform: {
      type: String,
      default: "Cvs Central Cluster",
    },
  },
  { timestamps: true }
);

// Use primaryConnection for the primary database
export const Project = primaryConnection.model<IProject>(
  "Project",
  ProjectSchema
);

import { Schema, Document, Types } from 'mongoose';
import { primaryConnection } from '../../config/database';

// Define interfaces for nested structures
interface IImage {
  url: string;
  alt: string;
}

interface ISeo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

interface IReply {
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
}

interface IComment {
  user: Types.ObjectId;
  text: string;
  createdAt: Date;
  replies: IReply[];
}

// Main Blog interface
export interface IBlog extends Document {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: Types.ObjectId;
  date: Date;
  updatedAt?: Date;
  readTime: string;
  category: string;
  tags: string[];
  image: IImage;
  featured: boolean;
  status: 'draft' | 'published' | 'archived';
  seo: ISeo;
  comments: IComment[];
  likes: Types.ObjectId[];
  views: number;
}

// Define the schema
const BlogSchema = new Schema<IBlog>(
  { 
    id: { type: Number, required: true, unique: true }, 
    title: { type: String, required: true }, 
    slug: { type: String, required: true, unique: true }, // URL-friendly version of title 
    excerpt: { type: String, required: true }, 
    content: { type: String, required: true }, // The full HTML/markdown content 
    author: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Reference to the author 
    date: { type: Date, required: true, default: Date.now }, 
    updatedAt: { type: Date }, // Last modified date 
    readTime: { type: String, required: true }, 
    category: { type: String, required: true }, 
    tags: [{ type: String }], // Array of tags for better organization 
    image: { 
      url: { type: String }, 
      alt: { type: String } 
    }, 
    featured: { type: Boolean, default: false }, // For featured posts 
    status: { 
      type: String, 
      enum: ['draft', 'published', 'archived'], 
      default: 'draft' 
    }, 
    seo: { 
      metaTitle: { type: String }, 
      metaDescription: { type: String }, 
      keywords: [{ type: String }] 
    }, 
    comments: [{ 
      user: { type: Schema.Types.ObjectId, ref: 'User' }, 
      text: { type: String, required: true }, 
      createdAt: { type: Date, default: Date.now }, 
      replies: [{ 
        user: { type: Schema.Types.ObjectId, ref: 'User' }, 
        text: { type: String, required: true }, 
        createdAt: { type: Date, default: Date.now } 
      }] 
    }], 
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], 
    views: { type: Number, default: 0 } 
  },
  { timestamps: true }
);

// Create and export the model using primaryConnection
export const Blog = primaryConnection.model<IBlog>('Blog', BlogSchema);
import { Schema, Document } from 'mongoose';
import { primaryConnection } from '../../config/database';

export interface IPrimaryModel extends Document {
  name: string;
  description: string;
  createdAt: Date;
}

const PrimaryModelSchema = new Schema<IPrimaryModel>({
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const PrimaryModel = primaryConnection.model<IPrimaryModel>('PrimaryModel', PrimaryModelSchema);
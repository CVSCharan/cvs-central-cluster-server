import { Schema, Document } from "mongoose";
import { secondaryConnection } from "../config/database";

export interface ISecondaryModel extends Document {
  title: string;
  content: string;
  createdAt: Date;
}

const SecondaryModelSchema = new Schema<ISecondaryModel>({
  title: { type: String, required: true },
  content: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const SecondaryModel = secondaryConnection.model<ISecondaryModel>(
  "SecondaryModel",
  SecondaryModelSchema
);

import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    session: {
      type: Object,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", SessionSchema);
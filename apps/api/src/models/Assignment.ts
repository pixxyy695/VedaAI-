import mongoose, { Schema, type Model } from "mongoose";
import type { AssignmentRecord } from "@vedai/shared";

const assignmentSchema = new Schema<AssignmentRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    input: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      required: true,
      enum: ["queued", "reading_source", "prompting", "generating", "structuring", "completed", "failed"]
    },
    progress: { type: Number, required: true, min: 0, max: 100 },
    statusMessage: { type: String, required: true },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  {
    collection: "assignments",
    versionKey: false
  }
);

assignmentSchema.index({ createdAt: -1 });

export const AssignmentModel: Model<AssignmentRecord> =
  (mongoose.models.Assignment as Model<AssignmentRecord> | undefined) ??
  mongoose.model<AssignmentRecord>("Assignment", assignmentSchema);

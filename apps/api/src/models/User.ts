import mongoose, { Schema, type Model } from "mongoose";

export type UserDocument = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

const userSchema = new Schema<UserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  {
    collection: "users",
    versionKey: false
  }
);

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);

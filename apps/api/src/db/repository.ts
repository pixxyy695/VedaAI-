import crypto from "node:crypto";
import mongoose from "mongoose";
import type { AssignmentRecord, AssignmentRequest } from "@vedai/shared";
import { assignmentRecordSchema } from "@vedai/shared";
import { config } from "../config.js";
import { AssignmentModel } from "../models/Assignment.js";
import { UserModel, type UserDocument } from "../models/User.js";

const memoryAssignments = new Map<string, AssignmentRecord>();
const memoryUsers = new Map<string, UserDocument>();

let memoryMode = config.useMemoryDb;
let initialized = false;

const now = () => new Date().toISOString();

export async function initRepository() {
  if (initialized) {
    return { mode: memoryMode ? "memory" : "mongodb" };
  }

  if (memoryMode) {
    initialized = true;
    return { mode: "memory" };
  }

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 1200,
      autoIndex: true
    });
    initialized = true;
    return { mode: "mongodb" };
  } catch (error) {
    memoryMode = true;
    initialized = true;
    console.warn("[db] MongoDB unavailable, using in-memory repository for this session.");
    return { mode: "memory", error };
  }
}

function normalize(record: unknown): AssignmentRecord {
  const doc = record as AssignmentRecord & { _doc?: AssignmentRecord };
  const base = doc._doc ?? doc;
  return assignmentRecordSchema.parse({
    ...base,
    result: base.result ?? null,
    error: base.error ?? null
  });
}

export async function createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserDocument> {
  const timestamp = now();
  const user: UserDocument = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (memoryMode) {
    memoryUsers.set(user.id, user);
    return user;
  }

  const created = await UserModel.create(user);
  return created.toObject();
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const normalizedEmail = email.toLowerCase();

  if (memoryMode) {
    return [...memoryUsers.values()].find((user) => user.email === normalizedEmail) ?? null;
  }

  const found = await UserModel.findOne({ email: normalizedEmail }).lean();
  return found ?? null;
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  if (memoryMode) {
    return memoryUsers.get(id) ?? null;
  }

  const found = await UserModel.findOne({ id }).lean();
  return found ?? null;
}

export async function createAssignment(input: AssignmentRequest, ownerId: string): Promise<AssignmentRecord> {
  const timestamp = now();
  const assignment: AssignmentRecord = {
    id: crypto.randomUUID(),
    ownerId,
    input,
    status: "queued",
    progress: 4,
    statusMessage: "Queued for generation",
    result: null,
    error: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (memoryMode) {
    memoryAssignments.set(assignment.id, assignment);
    return assignment;
  }

  const created = await AssignmentModel.create(assignment);
  return normalize(created.toObject());
}

export async function getAssignment(id: string): Promise<AssignmentRecord | null> {
  if (memoryMode) {
    return memoryAssignments.get(id) ?? null;
  }

  const found = await AssignmentModel.findOne({ id }).lean();
  return found ? normalize(found) : null;
}

export async function getAssignmentForOwner(id: string, ownerId: string): Promise<AssignmentRecord | null> {
  const assignment = await getAssignment(id);
  if (!assignment || assignment.ownerId !== ownerId) return null;
  return assignment;
}

export async function listAssignmentsForOwner(ownerId: string): Promise<AssignmentRecord[]> {
  if (memoryMode) {
    return [...memoryAssignments.values()]
      .filter((assignment) => assignment.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const found = await AssignmentModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
  return found.map((assignment) => normalize(assignment));
}

export async function updateAssignment(
  id: string,
  patch: Partial<Omit<AssignmentRecord, "id" | "input" | "createdAt">>
): Promise<AssignmentRecord | null> {
  const updatedAt = now();

  if (memoryMode) {
    const existing = memoryAssignments.get(id);
    if (!existing) return null;
    const updated = assignmentRecordSchema.parse({
      ...existing,
      ...patch,
      updatedAt,
      result: patch.result === undefined ? existing.result : patch.result,
      error: patch.error === undefined ? existing.error : patch.error
    });
    memoryAssignments.set(id, updated);
    return updated;
  }

  const updated = await AssignmentModel.findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt } },
    { new: true, lean: true }
  );

  return updated ? normalize(updated) : null;
}

export async function resetAssignment(id: string): Promise<AssignmentRecord | null> {
  return updateAssignment(id, {
    status: "queued",
    progress: 4,
    statusMessage: "Queued for regeneration",
    result: null,
    error: null
  });
}

export async function closeRepository() {
  if (!memoryMode && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

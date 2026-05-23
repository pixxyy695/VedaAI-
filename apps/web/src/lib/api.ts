import type { AssignmentRecord, AssignmentRequest, AuthSession, LoginRequest, RegisterRequest, User } from "@vedai/shared";
import { API_URL } from "./config";

type AssignmentResponse = {
  assignment: AssignmentRecord;
};

type AssignmentsResponse = {
  assignments: AssignmentRecord[];
};

type MeResponse = {
  user: User;
};

const authHeaders = (token?: string | null): HeadersInit => token ? { Authorization: `Bearer ${token}` } : {};

async function parseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));
  return new Error(payload.error ?? fallback);
}

export async function register(input: RegisterRequest) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input)
  });

  if (!response.ok) throw await parseError(response, "Unable to create account");
  return (await response.json()) as AuthSession;
}

export async function login(input: LoginRequest) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input)
  });

  if (!response.ok) throw await parseError(response, "Unable to sign in");
  return (await response.json()) as AuthSession;
}

export async function logout(token?: string | null) {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(token)
  });
}

export async function getMe(token?: string | null) {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
    headers: authHeaders(token),
    cache: "no-store"
  });

  if (!response.ok) throw await parseError(response, "Authentication required");
  return (await response.json()) as MeResponse;
}

export async function createAssignment(input: AssignmentRequest, sourceFile?: File | null, token?: string | null) {
  const formData = new FormData();
  formData.append("title", input.title);
  formData.append("subject", input.subject);
  formData.append("grade", input.grade);
  formData.append("dueDate", input.dueDate);
  formData.append("durationMinutes", String(input.durationMinutes));
  formData.append("questionTypes", JSON.stringify(input.questionTypes));
  formData.append("numberOfQuestions", String(input.numberOfQuestions));
  formData.append("marksPerQuestion", String(input.marksPerQuestion));
  formData.append("difficultyMix", JSON.stringify(input.difficultyMix));
  formData.append("instructions", input.instructions);
  formData.append("sourceText", input.sourceText);
  if (sourceFile) formData.append("sourceFile", sourceFile);

  const response = await fetch(`${API_URL}/assignments`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(token),
    body: formData
  });

  if (!response.ok) {
    throw await parseError(response, "Unable to create assignment");
  }

  return (await response.json()) as AssignmentResponse;
}

export async function listAssignments(token?: string | null) {
  const response = await fetch(`${API_URL}/assignments`, {
    credentials: "include",
    headers: authHeaders(token),
    cache: "no-store"
  });

  if (!response.ok) throw await parseError(response, "Unable to load assignments");
  return (await response.json()) as AssignmentsResponse;
}

export async function getAssignment(id: string, token?: string | null) {
  const response = await fetch(`${API_URL}/assignments/${id}`, {
    credentials: "include",
    headers: authHeaders(token),
    cache: "no-store"
  });

  if (!response.ok) {
    throw await parseError(response, "Assignment not found");
  }

  return (await response.json()) as AssignmentResponse;
}

export async function regenerateAssignment(id: string, token?: string | null) {
  const response = await fetch(`${API_URL}/assignments/${id}/regenerate`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Unable to regenerate assignment");
  }

  return (await response.json()) as AssignmentResponse;
}

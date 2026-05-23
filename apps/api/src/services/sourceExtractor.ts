import pdfParse from "pdf-parse";
import type { Express } from "express";

export async function extractSourceText(file?: Express.Multer.File) {
  if (!file) return "";

  const name = file.originalname.toLowerCase();
  if (file.mimetype === "application/pdf" || name.endsWith(".pdf")) {
    const parsed = await pdfParse(file.buffer);
    return parsed.text.trim();
  }

  if (file.mimetype.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return file.buffer.toString("utf8").trim();
  }

  return "";
}

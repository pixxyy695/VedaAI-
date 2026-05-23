import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "VedaAI Assessment Creator",
  description: "AI-assisted assignment and question paper creator for teachers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

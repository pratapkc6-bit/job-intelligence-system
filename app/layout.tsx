import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Darwin Job Intelligence",
  description: "Track Darwin IT roles, skills demand, and job-readiness signals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

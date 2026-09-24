import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pratap IT Support Lab",
  description: "Interactive IT support troubleshooting simulator and technical portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

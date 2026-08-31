import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { AppShellLayout } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "DP-MAS — Proposal Management & Approval System",
  description: "Curriculum Implementation Division Proposal Management and Approval System for DepEd Schools Division Office of Sorsogon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AppShellLayout>{children}</AppShellLayout>
        </Providers>
      </body>
    </html>
  );
}

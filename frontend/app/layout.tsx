import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JobReady — тренажёр собеседований с AI",
    template: "%s · JobReady",
  },
  description:
    "Пройди пробное интервью с AI-интервьюером, получи разбор ответов и персональный план подготовки.",
};

export const viewport: Viewport = {
  themeColor: "#090604",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

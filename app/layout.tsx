import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  return {
    title: settings.companyName || "Orélia",
    description: "BnB ID Proof Manager",
    icons: {
      icon: settings.favicon || "/favicon.ico",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.companyName || "Oryva",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-[#F8FAFC]">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

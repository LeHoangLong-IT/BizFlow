import type { Metadata, Viewport } from "next";
import { Mulish, Oswald } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  variable: "--font-inter", // Keep variable name same so globals.css works
  subsets: ["latin", "vietnamese"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "vietnamese"],
});

export const viewport: Viewport = {
  themeColor: "#1f3b6c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "BizFlow - Làm Việc Thông Minh",
  description: "Nền tảng quản lý công việc và không gian làm việc cá nhân BizFlow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BizFlow",
  },
};

import GlobalHeader from "@/components/GlobalHeader";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mulish.variable} ${oswald.variable} h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <GlobalHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

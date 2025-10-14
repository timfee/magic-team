import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { ToastProvider } from "@/lib/contexts/toast-context";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MagicRetro - Collaborative Retrospectives",
  description: "Real-time collaborative retrospective sessions for teams",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

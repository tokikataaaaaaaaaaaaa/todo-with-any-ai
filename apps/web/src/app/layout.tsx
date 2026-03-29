import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SnackbarProvider } from "@/components/ui/snackbar-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo with Any AI",
  description: "AI-powered todo application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <SnackbarProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

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
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="relative z-[1]">
        <AuthProvider>
          <SnackbarProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

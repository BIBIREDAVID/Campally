import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/shared/sw-register";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { OfflineQueueSync } from "@/components/cases/offline-queue-sync";
import { getActiveTenant } from "@/lib/queries/tenant";

const DEFAULT_PRIMARY_COLOR = "#3b6ef6";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Union — LASU Students' Union",
  description: "Your Student Union, in your pocket.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a6e",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tenant = await getActiveTenant();
  // Only override the design system's default blue when an admin has
  // deliberately set a different one via /admin/settings — leaves the
  // carefully-tuned oklch palette untouched for the common case.
  const customPrimary =
    tenant?.primary_color && tenant.primary_color.toLowerCase() !== DEFAULT_PRIMARY_COLOR
      ? tenant.primary_color
      : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
      style={customPrimary ? ({ "--primary": customPrimary, "--ring": customPrimary } as React.CSSProperties) : undefined}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
          <ServiceWorkerRegister />
          <OfflineQueueSync />
        </ThemeProvider>
      </body>
    </html>
  );
}

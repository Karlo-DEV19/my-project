import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import CartSheet from "@/components/ui/cart-sheet"
import ThemeProvider from "@/components/theme-provider"

// Providers
import { AuthProvider } from "@/lib/providers/auth-provider"
import QueryProvider from "@/lib/providers/query-provider"
// ❌ REMOVED: SidebarProvider

// Server Actions

import "./globals.css"
import { getUserSession } from "../../actions/auth"
import Script from "next/script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// ==========================================
// MJ DECORS METADATA
// ==========================================
export const metadata: Metadata = {
  title: {
    default: "MJ Decors | Premium Window Treatments",
    template: "%s | MJ Decors",
  },
  description:
    "Mastering light and space. We offer premium Korean combi blinds, custom fit shades, and expert design consultation for the modern home.",
  keywords: [
    "MJ Decors",
    "premium blinds",
    "combi shades",
    "Korean blinds",
    "window treatments",
    "interior design",
    "home decor",
  ],
  authors: [{ name: "MJ Decors" }],
  creator: "MJ Decors",
  applicationName: "MJ Decors",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch the session securely on the server before rendering the page
  const session = await getUserSession()
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans min-h-screen bg-background text-foreground`}
      >
        {/*       <Script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        /> */}
        <ThemeProvider>
          <QueryProvider>
            {/* Inject the server session into the Client AuthProvider */}
            <AuthProvider session={session}>
              {/* ✅ FIX: Just render children. No SidebarProvider here! */}
              {children}
            </AuthProvider>
            <CartSheet />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
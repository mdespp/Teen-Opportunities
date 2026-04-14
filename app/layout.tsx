import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://teenopportunities.com"),
  title: "Teen Opportunities",
  description: "Opportunities for high school students.",
  icons: {
    icon: [
      { url: "/logos/logo.png", type: "image/png" },
      { url: "/logos/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logos/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logos/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logos/logo.png",
    apple: "/logos/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6F4E37",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f5eee8] text-zinc-900 antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
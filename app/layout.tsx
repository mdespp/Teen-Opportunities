import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teen Opportunities",
  description: "Opportunities for high school students.",
  icons: {
    icon: "/logos/logo.png",
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
      </body>
    </html>
  );
}
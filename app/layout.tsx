import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teen Opportunities",
  description: "Opportunities for high school students.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
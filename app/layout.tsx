import type { Metadata } from "next";
import "./globals.css";
import "ckeditor5/ckeditor5.css";

export const metadata: Metadata = {
  title: "Techforge Innovations | Test Portal",
  description: "AI-powered candidate assessment and secure test management portal.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

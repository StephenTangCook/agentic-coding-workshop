import type { Metadata } from "next";
import localFont from "next/font/local";
import { Quicksand } from "next/font/google";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GitHub Compatibility Quiz",
  description: "Find your perfect coding match with our dating-app style compatibility quiz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${quicksand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

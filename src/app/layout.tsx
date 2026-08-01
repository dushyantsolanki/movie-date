import type { Metadata } from "next";
import { Outfit, Dancing_Script } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-romantic",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LoveTheater 💕 — Virtual Movie Date Platform",
  description:
    "The ultimate virtual movie date experience. Share a screen, upload movies via Cloudinary, video call, and sync playback with your partner in real-time.",
  keywords: ["movie date", "virtual date", "watch together", "screen share", "couples"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dancingScript.variable} dark`}
    >
      <body>
        <TooltipProvider delay={200}>{children}</TooltipProvider>
      </body>
    </html>
  );
}

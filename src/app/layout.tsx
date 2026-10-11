import type { Metadata } from "next";
<<<<<<< Updated upstream
import { Inter, Geist, Geist_Mono } from "next/font/google";
=======
import { Inter } from "next/font/google";
>>>>>>> Stashed changes
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
<<<<<<< Updated upstream
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
=======
>>>>>>> Stashed changes
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
<<<<<<< Updated upstream
  title: "NexaReach Marketing OS",
  description: "Enterprise Multi-Channel Marketing OS & Verification Platform",
=======
  metadataBase: new URL("https://nexareach.io"),
  title: "NexaReach | AI-Powered Marketing Automation Platform",
  description:
    "Discover NexaReach, the AI-powered marketing platform for email verification, outreach, WhatsApp campaigns, social media, lead intelligence, and automated workflows.",
  keywords: [
    "NexaReach",
    "Marketing Automation",
    "Email Verification",
    "WhatsApp Marketing",
    "Social Media Publishing",
    "Lead Intelligence",
    "AI Marketing Agents",
    "Omnichannel Marketing",
  ],
  authors: [{ name: "NexaReach" }],
  openGraph: {
    title: "NexaReach — One Platform. Every Channel. Smarter Growth.",
    description:
      "Discover leads, verify emails, launch campaigns, automate conversations, and turn customer engagement into measurable growth — all from one AI-powered workspace.",
    url: "https://nexareach.io",
    siteName: "NexaReach",
    images: [
      {
        url: "/images/team-collaboration.jpg",
        width: 1200,
        height: 630,
        alt: "NexaReach AI Marketing Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexaReach — One Platform. Every Channel. Smarter Growth.",
    description:
      "Discover leads, verify emails, launch campaigns, and automate conversations from one connected workspace.",
  },
>>>>>>> Stashed changes
};

export default function RootLayout({
  children,
<<<<<<< Updated upstream
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
=======
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#ffffff] text-[#0F172A] font-sans selection:bg-[#000000] selection:text-white">
        {children}
      </body>
>>>>>>> Stashed changes
    </html>
  );
}

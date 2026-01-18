import type { Metadata } from "next";
import { Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-brand-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-brand-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clarisend.co"),
  title: {
    default: "ClariSend - Transparent Cross-Border Money Transfers",
    template: "%s | ClariSend",
  },
  description:
    "Send money internationally with crystal-clear pricing. Compare routes, save on fees, and get the best rates for your money transfers.",
  keywords: ["remittance", "money transfer", "international payments", "forex"],
  openGraph: {
    title: "ClariSend - Transparent Cross-Border Money Transfers",
    description:
      "Send money internationally with crystal-clear pricing. Compare routes, save on fees, and get the best rates for your money transfers.",
    url: "https://clarisend.co",
    siteName: "ClariSend",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "ClariSend",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClariSend - Transparent Cross-Border Money Transfers",
    description:
      "Send money internationally with crystal-clear pricing. Compare routes, save on fees, and get the best rates for your money transfers.",
    images: ["/og.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

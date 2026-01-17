import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Space_Grotesk } from "next/font/google";
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
  title: "ClariSend — Send with clarity",
  description:
    "Transparent global payments and remittances with clear fees, smart routing, and modern payout rails.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const htmlLang = localeCookie === "fr" ? "fr" : "en";

  return (
    <html lang={htmlLang}>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

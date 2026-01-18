import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Space_Grotesk } from "next/font/google";
import AuthSessionProvider from "@/components/SessionProvider";
import { getServerAuthSession } from "@/src/lib/auth";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("locale")?.value;
  const htmlLang = localeCookie === "fr" ? "fr" : "en";
  const session = await getServerAuthSession();

  return (
    <html lang={htmlLang}>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}
      >
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Space_Grotesk } from "next/font/google";
import AuthSessionProvider from "@/components/SessionProvider";
import { getServerAuthSession } from "@/src/lib/auth";
import Providers from "./providers";
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
  metadataBase: new URL("https://app.clarisend.co"),
  title: "ClariSend — Send with clarity",
  description:
    "Transparent global payments and remittances with clear fees, smart routing, and modern payout rails.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
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
  const session = await getServerAuthSession();

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${fraunces.variable} min-h-screen bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100`}
      >
        <Providers>
          <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
        </Providers>
      </body>
    </html>
  );
}

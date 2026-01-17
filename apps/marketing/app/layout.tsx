import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClariSend - Transparent Cross-Border Money Transfers",
  description:
    "Send money internationally with crystal-clear pricing. Compare routes, save on fees, and get the best rates for your money transfers.",
  keywords: ["remittance", "money transfer", "international payments", "forex"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

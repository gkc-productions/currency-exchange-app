import Header from "@/components/Header";
import Footer from "@/components/Footer";

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = locale === "fr" ? "fr" : "en";

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={validLocale} />
      <main className="flex-1">{children}</main>
      <Footer locale={validLocale} />
    </div>
  );
}

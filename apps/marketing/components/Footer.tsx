import Link from "next/link";

type FooterProps = {
  locale: "en" | "fr";
};

export default function Footer({ locale }: FooterProps) {
  const messages = {
    en: {
      tagline: "Transparent cross-border money transfers",
      product: "Product",
      howItWorks: "How It Works",
      security: "Security",
      pricing: "Pricing",
      company: "Company",
      about: "About",
      contact: "Contact",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All rights reserved.",
    },
    fr: {
      tagline: "Transferts d'argent internationaux transparents",
      product: "Produit",
      howItWorks: "Comment ça marche",
      security: "Sécurité",
      pricing: "Tarification",
      company: "Entreprise",
      about: "À propos",
      contact: "Contact",
      legal: "Légal",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      rights: "Tous droits réservés.",
    },
  };

  const t = messages[locale];

  return (
    <footer className="bg-white border-t border-slate-200/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-slate-900">ClariSend</span>
            </Link>
            <p className="text-sm text-slate-600">{t.tagline}</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">{t.product}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/how-it-works`}
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  {t.howItWorks}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/security`}
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  {t.security}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  {t.pricing}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">{t.company}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  {t.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">{t.legal}</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-slate-600">{t.privacy}</span>
              </li>
              <li>
                <span className="text-sm text-slate-600">{t.terms}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200/70">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} ClariSend. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

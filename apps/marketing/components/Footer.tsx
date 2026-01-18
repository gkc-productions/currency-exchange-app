import Link from "next/link";

type FooterProps = {
  locale: "en" | "fr";
};

export default function Footer({ locale }: FooterProps) {
  const messages = {
    en: {
      tagline: "Send money internationally with clear pricing and predictable delivery.",
      product: "Product",
      howItWorks: "How It Works",
      security: "Security",
      pricing: "Pricing",
      company: "Company",
      contact: "Contact",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All rights reserved.",
      madeWith: "Built for transparency",
      regulated: "Compliance-focused transfer experience",
    },
    fr: {
      tagline: "Envoyez de l'argent a l'international avec des frais clairs et des delais previsibles.",
      product: "Produit",
      howItWorks: "Comment ca marche",
      security: "Securite",
      pricing: "Tarification",
      company: "Entreprise",
      contact: "Contact",
      legal: "Legal",
      privacy: "Politique de confidentialite",
      terms: "Conditions d'utilisation",
      rights: "Tous droits reserves.",
      madeWith: "Construit pour la transparence",
      regulated: "Experience de transfert axee conformite",
    },
  };

  const t = messages[locale];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                CS
              </div>
              <span className="text-lg font-semibold text-white tracking-tight">ClariSend</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {t.tagline}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t.product}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/how-it-works`}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t.howItWorks}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/security`}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t.security}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/pricing`}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t.pricing}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t.company}</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {t.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">{t.legal}</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-slate-500">{t.privacy}</span>
              </li>
              <li>
                <span className="text-sm text-slate-500">{t.terms}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ClariSend. {t.rights}
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-600">{t.regulated}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

type HeaderProps = {
  locale: "en" | "fr";
};

export default function Header({ locale }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messages = {
    en: {
      features: "Features",
      howItWorks: "How It Works",
      security: "Security",
      pricing: "Pricing",
      contact: "Contact",
      getStarted: "Get Started",
    },
    fr: {
      features: "Fonctionnalités",
      howItWorks: "Comment ça marche",
      security: "Sécurité",
      pricing: "Tarification",
      contact: "Contact",
      getStarted: "Commencer",
    },
  };

  const t = messages[locale];

  return (
    <header className="bg-white border-b border-slate-200/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-slate-900">ClariSend</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={`/${locale}/how-it-works`}
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {t.howItWorks}
            </Link>
            <Link
              href={`/${locale}/security`}
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {t.security}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {t.pricing}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {t.contact}
            </Link>
          </nav>

          {/* CTA & Language Selector */}
          <div className="hidden md:flex items-center gap-4">
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value as "en" | "fr";
                const currentPath = window.location.pathname;
                const newPath = currentPath.replace(/^\/(en|fr)/, `/${newLocale}`);
                window.location.href = newPath;
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            <a
              href="https://app.clarisend.co"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              {t.getStarted}
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-emerald-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200/70">
            <nav className="flex flex-col gap-4">
              <Link
                href={`/${locale}/how-it-works`}
                className="text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {t.howItWorks}
              </Link>
              <Link
                href={`/${locale}/security`}
                className="text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {t.security}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {t.pricing}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-slate-600 hover:text-emerald-600 transition-colors"
              >
                {t.contact}
              </Link>
              <div className="pt-4 border-t border-slate-200/70">
                <a
                  href="https://app.clarisend.co"
                  className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
                >
                  {t.getStarted}
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

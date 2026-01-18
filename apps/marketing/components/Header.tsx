"use client";

import Link from "next/link";
import { useState } from "react";
import TrackedLink from "@/components/TrackedLink";

type HeaderProps = {
  locale: "en" | "fr";
};

export default function Header({ locale }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messages = {
    en: {
      howItWorks: "How It Works",
      security: "Security",
      pricing: "Pricing",
      contact: "Contact",
      getStarted: "Get Started",
      login: "Log in",
    },
    fr: {
      howItWorks: "Comment ca marche",
      security: "Securite",
      pricing: "Tarification",
      contact: "Contact",
      getStarted: "Commencer",
      login: "Connexion",
    },
  };

  const t = messages[locale];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm shadow-sm group-hover:border-emerald-300 transition-colors">
              CS
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">ClariSend</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={`/${locale}/how-it-works`}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t.howItWorks}
            </Link>
            <Link
              href={`/${locale}/security`}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t.security}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t.pricing}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t.contact}
            </Link>
          </nav>

          {/* CTA & Language Selector */}
          <div className="hidden md:flex items-center gap-3">
            <select
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value as "en" | "fr";
                const currentPath = window.location.pathname;
                const newPath = currentPath.replace(/^\/(en|fr)/, `/${newLocale}`);
                window.location.href = newPath;
              }}
              className="px-2.5 py-1.5 text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
            <a
              href="https://app.clarisend.co"
              className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg transition-colors"
            >
              {t.login}
            </a>
            <TrackedLink
              href="https://app.clarisend.co"
              event="cta_get_started"
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t.getStarted}
            </TrackedLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100">
            <nav className="flex flex-col gap-1">
              <Link
                href={`/${locale}/how-it-works`}
                className="px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.howItWorks}
              </Link>
              <Link
                href={`/${locale}/security`}
                className="px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.security}
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.pricing}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t.contact}
              </Link>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <select
                  value={locale}
                  onChange={(e) => {
                    const newLocale = e.target.value as "en" | "fr";
                    const currentPath = window.location.pathname;
                    const newPath = currentPath.replace(/^\/(en|fr)/, `/${newLocale}`);
                    window.location.href = newPath;
                  }}
                  className="px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg"
                >
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-3">
                <a
                  href="https://app.clarisend.co"
                  className="text-center text-slate-600 hover:text-slate-900 py-2.5 rounded-lg border border-slate-200 transition-colors"
                >
                  {t.login}
                </a>
                <TrackedLink
                  href="https://app.clarisend.co"
                  event="cta_get_started"
                  className="text-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  {t.getStarted}
                </TrackedLink>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

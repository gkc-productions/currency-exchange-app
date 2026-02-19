"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuthSession } from "@/components/SessionProvider";
import type { Locale } from "@/src/lib/i18n/messages";
import { withLocale } from "@/src/lib/with-locale";

function normalizeReference(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export default function TrackTransferPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useAuthSession();
  const locale = useMemo<Locale>(() => {
    const value = params?.locale;
    if (Array.isArray(value)) {
      return value[0] === "fr" ? "fr" : "en";
    }
    return value === "fr" ? "fr" : "en";
  }, [params]);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeReference(reference);
    if (!normalized) {
      setError(locale === "fr" ? "Entrez une reference ou un identifiant de transfert." : "Enter a reference or transfer ID.");
      return;
    }
    setError(null);
    const nextPath = withLocale(`/transfer/${encodeURIComponent(normalized)}`, locale);
    if (status === "authenticated") {
      router.push(nextPath);
      return;
    }
    router.push(`${withLocale("/login", locale)}?next=${encodeURIComponent(nextPath)}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-8 lg:py-24">
      <SectionHeader
        eyebrow={locale === "fr" ? "Suivi" : "Tracking"}
        title={locale === "fr" ? "Suivre un transfert" : "Track a transfer"}
        subtitle={
          locale === "fr"
            ? "Entrez votre reference ou identifiant de transfert pour continuer."
            : "Enter your transfer reference or ID to continue."
        }
      />
      <Card className="mt-8">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" data-testid="track-transfer-form">
            <label className="block text-sm font-medium text-slate-700" htmlFor="transfer-reference">
              {locale === "fr" ? "Reference / ID de transfert" : "Reference / Transfer ID"}
            </label>
            <input
              id="transfer-reference"
              name="reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={locale === "fr" ? "Ex: CLS-123456 ou ID" : "e.g. CLS-123456 or transfer ID"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              autoComplete="off"
            />
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" variant="primary">
              {locale === "fr" ? "Suivre le transfert" : "Track transfer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

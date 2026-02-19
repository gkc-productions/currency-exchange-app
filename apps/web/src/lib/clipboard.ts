export async function copyText(value: string) {
  if (typeof navigator === "undefined") {
    return false;
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through
    }
  }
  return false;
}

export async function shareOrCopyReceiptLink({
  locale,
  transferId,
  fallbackOrigin,
}: {
  locale: string;
  transferId: string;
  fallbackOrigin?: string;
}) {
  if (typeof window === "undefined") {
    return { shared: false, copied: false, url: "" };
  }
  const origin = fallbackOrigin ?? window.location.origin;
  const url = `${origin}/${locale}/transfer/${transferId}?receipt=1`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "ClariSend receipt",
        text: "Transfer receipt",
        url,
      });
      return { shared: true, copied: false, url };
    } catch {
      // fallback to clipboard
    }
  }

  const copied = await copyText(url);
  return { shared: false, copied, url };
}

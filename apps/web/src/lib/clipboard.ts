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

import type { ReactNode } from "react";
import LocaleToggle from "./locale-toggle";

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed right-4 top-4 z-50">
        <LocaleToggle />
      </div>
      {children}
    </div>
  );
}

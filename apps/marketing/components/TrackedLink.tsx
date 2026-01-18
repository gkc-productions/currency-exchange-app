"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import Link from "next/link";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type TrackedLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  event?: AnalyticsEvent;
  payload?: Record<string, string | number | boolean>;
};

export default function TrackedLink({
  event,
  payload,
  onClick,
  ...props
}: TrackedLinkProps) {
  const handleClick = (eventClick: MouseEvent<HTMLAnchorElement>) => {
    if (event) {
      track(event, payload);
    }
    onClick?.(eventClick);
  };

  return <Link {...props} onClick={handleClick} />;
}

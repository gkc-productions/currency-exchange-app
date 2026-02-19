"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ClientSession = {
  user: {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  expires: string;
} | null;

type SessionContextValue = {
  session: ClientSession;
  status: "loading" | "authenticated" | "unauthenticated";
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchSession(): Promise<ClientSession> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json().catch(() => null)) as
    | { session?: ClientSession }
    | null;
  return payload?.session ?? null;
}

export default function AuthSessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: ClientSession;
}) {
  const [currentSession, setCurrentSession] = useState<ClientSession>(session ?? null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    session ? "authenticated" : "loading",
  );

  const refresh = async () => {
    setStatus("loading");
    const next = await fetchSession();
    setCurrentSession(next);
    setStatus(next ? "authenticated" : "unauthenticated");
  };

  useEffect(() => {
    if (session) {
      setStatus("authenticated");
      return;
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session: currentSession,
      status,
      refresh,
    }),
    [currentSession, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(SessionContext);
  if (!context) {
    return {
      data: null as ClientSession,
      status: "unauthenticated" as const,
      refresh: async () => {},
    };
  }
  return {
    data: context.session,
    status: context.status,
    refresh: context.refresh,
  };
}

export async function signOutClient(locale: "en" | "fr") {
  await fetch("/api/auth/logout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{}",
  }).catch(() => null);
  window.location.assign(`/${locale}`);
}

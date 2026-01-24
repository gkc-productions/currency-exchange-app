import { NextResponse } from "next/server";

type DbStatus = {
  ok: boolean;
  latencyMs?: number;
  error?: string;
};

type RateCacheStatus = {
  ok: boolean;
  size?: number;
  ageMs?: number | null;
  lastUpdatedAt?: Date | null;
  error?: string;
};

type CorridorSummary = {
  from: string;
  to: string;
  rails: string[];
  routeCount: number;
};

type CorridorRow = {
  fromAsset: { code: string };
  toAsset: { code: string };
  routes: Array<{ rail: string }>;
};

type PrismaClientLike = {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
  corridor: {
    findMany: (args: {
      where: { isActive: boolean };
      include: {
        fromAsset: { select: { code: true } };
        toAsset: { select: { code: true } };
        routes: { where: { isActive: boolean }; select: { rail: true } };
      };
    }) => Promise<CorridorRow[]>;
  };
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? "unknown";

  let prismaInstance: PrismaClientLike | null = null;
  let prismaError: string | null = null;

  try {
    const prismaModule = await import("@/src/lib/prisma");
    prismaInstance = prismaModule.prisma as unknown as PrismaClientLike;
  } catch (error) {
    prismaError = toErrorMessage(error);
  }

  const dbStart = Date.now();
  let db: DbStatus = { ok: false };

  if (!prismaInstance) {
    db = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: prismaError ?? "Prisma unavailable",
    };
  } else {
    try {
      await prismaInstance.$queryRaw`SELECT 1`;
      db = { ok: true, latencyMs: Date.now() - dbStart };
    } catch (error) {
      db = {
        ok: false,
        latencyMs: Date.now() - dbStart,
        error: toErrorMessage(error),
      };
    }
  }

  let rateCache: RateCacheStatus = { ok: false };
  try {
    const ratesModule = await import("@/src/lib/rates");
    const snapshot = ratesModule.getRateCacheSnapshot();
    rateCache = { ok: true, ...snapshot };
  } catch (error) {
    rateCache = { ok: false, error: toErrorMessage(error) };
  }

  let corridors: CorridorSummary[] = [];
  let rails: string[] = [];
  let corridorsError: string | undefined;

  if (prismaInstance && db.ok) {
    try {
      const corridorRows = await prismaInstance.corridor.findMany({
        where: { isActive: true },
        include: {
          fromAsset: { select: { code: true } },
          toAsset: { select: { code: true } },
          routes: { where: { isActive: true }, select: { rail: true } },
        },
      });

      const railSet = new Set<string>();
      corridors = corridorRows.map((corridor) => {
        const corridorRails = Array.from(
          new Set<string>(corridor.routes.map((route) => route.rail))
        );
        corridorRails.forEach((rail) => railSet.add(rail));
        return {
          from: corridor.fromAsset.code,
          to: corridor.toAsset.code,
          rails: corridorRails,
          routeCount: corridor.routes.length,
        };
      });
      rails = Array.from(railSet);
    } catch (error) {
      corridorsError = toErrorMessage(error);
    }
  }

  const payload: {
    ok: boolean;
    db: DbStatus;
    rateCache: RateCacheStatus;
    corridors: CorridorSummary[];
    rails: string[];
    version: string;
    timestamp: string;
    corridorsError?: string;
  } = {
    ok: true,
    db,
    rateCache,
    corridors,
    rails,
    version,
    timestamp,
  };

  if (corridorsError) {
    payload.corridorsError = corridorsError;
  }

  return NextResponse.json(payload, { status: 200 });
}

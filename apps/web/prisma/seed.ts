import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const assets = [
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, kind: "FIAT" },
  { code: "EUR", name: "Euro", symbol: "EUR", decimals: 2, kind: "FIAT" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GHS", decimals: 2, kind: "FIAT" },
  { code: "NGN", name: "Nigerian Naira", symbol: "NGN", decimals: 2, kind: "FIAT" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", decimals: 0, kind: "FIAT" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "CFA", decimals: 0, kind: "FIAT" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KES", decimals: 2, kind: "FIAT" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "UGX", decimals: 0, kind: "FIAT" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TZS", decimals: 2, kind: "FIAT" },
  { code: "ZAR", name: "South African Rand", symbol: "ZAR", decimals: 2, kind: "FIAT" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", decimals: 2, kind: "FIAT" },
  { code: "EGP", name: "Egyptian Pound", symbol: "EGP", decimals: 2, kind: "FIAT" },
  { code: "DZD", name: "Algerian Dinar", symbol: "DZD", decimals: 2, kind: "FIAT" },
  { code: "TND", name: "Tunisian Dinar", symbol: "TND", decimals: 3, kind: "FIAT" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RWF", decimals: 0, kind: "FIAT" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "ETB", decimals: 2, kind: "FIAT" },
  { code: "XPF", name: "CFP Franc", symbol: "XPF", decimals: 0, kind: "FIAT" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "XCD", decimals: 2, kind: "FIAT" },
  { code: "BTC", name: "Bitcoin", symbol: "BTC", decimals: 8, kind: "CRYPTO" },
];

async function main() {
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { code: asset.code },
      update: {
        name: asset.name,
        symbol: asset.symbol,
        decimals: asset.decimals,
        kind: asset.kind as any,
        isActive: true,
      },
      create: {
        code: asset.code,
        name: asset.name,
        symbol: asset.symbol,
        decimals: asset.decimals,
        kind: asset.kind as any,
        isActive: true,
      },
    });
  }

  const corridors = [
    { from: "USD", to: "GHS" },
    { from: "USD", to: "XOF" },
  ];

  for (const corridor of corridors) {
    const [fromAsset, toAsset] = await prisma.$transaction([
      prisma.asset.findUnique({ where: { code: corridor.from } }),
      prisma.asset.findUnique({ where: { code: corridor.to } }),
    ]);

    if (!fromAsset || !toAsset) {
      throw new Error(`Missing asset for corridor ${corridor.from} -> ${corridor.to}`);
    }

    const savedCorridor = await prisma.corridor.upsert({
      where: {
        fromAssetId_toAssetId: {
          fromAssetId: fromAsset.id,
          toAssetId: toAsset.id,
        },
      },
      update: { isActive: true },
      create: {
        fromAssetId: fromAsset.id,
        toAssetId: toAsset.id,
        isActive: true,
      },
    });

    const routeSeeds =
      corridor.from === "USD" && corridor.to === "GHS"
        ? [
            {
              rail: "MOBILE_MONEY",
              provider: "MockMoMo",
              feeFixed: 2.5,
              feePct: 1.6,
              fxMarginPct: 1.9,
              etaMinMinutes: 5,
              etaMaxMinutes: 20,
            },
            {
              rail: "BANK",
              provider: "MockBank",
              feeFixed: 1.5,
              feePct: 1.0,
              fxMarginPct: 1.2,
              etaMinMinutes: 60,
              etaMaxMinutes: 180,
            },
            {
              rail: "LIGHTNING",
              provider: "LightningLSP",
              feeFixed: 0.9,
              feePct: 0.7,
              fxMarginPct: 0.4,
              etaMinMinutes: 1,
              etaMaxMinutes: 5,
            },
          ]
        : [
            {
              rail: "MOBILE_MONEY",
              provider: "MockMoMo",
              feeFixed: 3.0,
              feePct: 1.8,
              fxMarginPct: 2.1,
              etaMinMinutes: 10,
              etaMaxMinutes: 35,
            },
            {
              rail: "BANK",
              provider: "MockBank",
              feeFixed: 2.0,
              feePct: 1.2,
              fxMarginPct: 1.5,
              etaMinMinutes: 90,
              etaMaxMinutes: 240,
            },
            {
              rail: "LIGHTNING",
              provider: "LightningLSP",
              feeFixed: 1.1,
              feePct: 0.8,
              fxMarginPct: 0.6,
              etaMinMinutes: 2,
              etaMaxMinutes: 8,
            },
          ];

    for (const route of routeSeeds) {
      const existing = await prisma.route.findFirst({
        where: {
          corridorId: savedCorridor.id,
          rail: route.rail as any,
          provider: route.provider,
        },
      });

      const payload = {
        corridorId: savedCorridor.id,
        rail: route.rail as any,
        provider: route.provider,
        feeFixed: route.feeFixed as any,
        feePct: route.feePct as any,
        fxMarginPct: route.fxMarginPct as any,
        etaMinMinutes: route.etaMinMinutes,
        etaMaxMinutes: route.etaMaxMinutes,
        isActive: true,
      };

      if (existing) {
        await prisma.route.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        await prisma.route.create({ data: payload });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

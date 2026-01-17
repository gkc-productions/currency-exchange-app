-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "sendAmount" DECIMAL(18,2) NOT NULL,
    "marketRate" DECIMAL(18,6) NOT NULL,
    "fxMarginPct" DECIMAL(5,2) NOT NULL,
    "feeFixed" DECIMAL(18,2) NOT NULL,
    "feePct" DECIMAL(5,2) NOT NULL,
    "appliedRate" DECIMAL(18,6) NOT NULL,
    "totalFee" DECIMAL(18,2) NOT NULL,
    "recipientGets" DECIMAL(18,2) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

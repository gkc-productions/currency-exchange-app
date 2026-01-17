export type RateQuote = {
  rate: number;
  timestamp: Date;
};

export type RateProvider = {
  name: string;
  getRate: (from: string, to: string) => Promise<RateQuote>;
};

export class MockRateProvider implements RateProvider {
  name = "MockRateProvider";

  async getRate(fromInput: string, toInput: string): Promise<RateQuote> {
    const from = fromInput.toUpperCase();
    const to = toInput.toUpperCase();
    const usdToGhs = 12.35;
    const btcToUsd = 67000;

    const directRates: Record<string, number> = {
      "USD:GHS": usdToGhs,
      "GHS:USD": 1 / usdToGhs,
      "BTC:USD": btcToUsd,
      "USD:BTC": 1 / btcToUsd,
      "BTC:GHS": btcToUsd * usdToGhs,
      "GHS:BTC": 1 / (btcToUsd * usdToGhs),
    };

    return {
      rate: directRates[`${from}:${to}`] ?? 1,
      timestamp: new Date(),
    };
  }
}

export type CountryOption = {
  id: string;
  countryCode: string;
  countryName: string;
  assetCode: string;
  assetName: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  {
    id: "us-usd",
    countryCode: "US",
    countryName: "United States",
    assetCode: "USD",
    assetName: "US Dollar",
  },
  {
    id: "fr-eur",
    countryCode: "FR",
    countryName: "France",
    assetCode: "EUR",
    assetName: "Euro",
  },
  {
    id: "gh-ghs",
    countryCode: "GH",
    countryName: "Ghana",
    assetCode: "GHS",
    assetName: "Ghanaian Cedi",
  },
  {
    id: "ng-ngn",
    countryCode: "NG",
    countryName: "Nigeria",
    assetCode: "NGN",
    assetName: "Nigerian Naira",
  },
  {
    id: "sn-xof",
    countryCode: "SN",
    countryName: "Senegal",
    assetCode: "XOF",
    assetName: "West African CFA Franc",
  },
  {
    id: "cm-xaf",
    countryCode: "CM",
    countryName: "Cameroon",
    assetCode: "XAF",
    assetName: "Central African CFA Franc",
  },
  {
    id: "ke-kes",
    countryCode: "KE",
    countryName: "Kenya",
    assetCode: "KES",
    assetName: "Kenyan Shilling",
  },
  {
    id: "ug-ugx",
    countryCode: "UG",
    countryName: "Uganda",
    assetCode: "UGX",
    assetName: "Ugandan Shilling",
  },
  {
    id: "tz-tzs",
    countryCode: "TZ",
    countryName: "Tanzania",
    assetCode: "TZS",
    assetName: "Tanzanian Shilling",
  },
  {
    id: "za-zar",
    countryCode: "ZA",
    countryName: "South Africa",
    assetCode: "ZAR",
    assetName: "South African Rand",
  },
  {
    id: "ma-mad",
    countryCode: "MA",
    countryName: "Morocco",
    assetCode: "MAD",
    assetName: "Moroccan Dirham",
  },
  {
    id: "eg-egp",
    countryCode: "EG",
    countryName: "Egypt",
    assetCode: "EGP",
    assetName: "Egyptian Pound",
  },
  {
    id: "dz-dzd",
    countryCode: "DZ",
    countryName: "Algeria",
    assetCode: "DZD",
    assetName: "Algerian Dinar",
  },
  {
    id: "tn-tnd",
    countryCode: "TN",
    countryName: "Tunisia",
    assetCode: "TND",
    assetName: "Tunisian Dinar",
  },
  {
    id: "lc-xcd",
    countryCode: "LC",
    countryName: "Saint Lucia",
    assetCode: "XCD",
    assetName: "East Caribbean Dollar",
  },
  {
    id: "gl-btc",
    countryCode: "GL",
    countryName: "Global",
    assetCode: "BTC",
    assetName: "Bitcoin",
  },
];

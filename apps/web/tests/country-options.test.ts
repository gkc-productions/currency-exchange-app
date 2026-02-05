import test from "node:test";
import assert from "node:assert/strict";
import { COUNTRY_OPTIONS } from "../components/country-options";

test("XAF supports multiple countries", () => {
  const xafCountries = new Set(
    COUNTRY_OPTIONS.filter((option) => option.assetCode === "XAF").map(
      (option) => option.countryCode
    )
  );
  assert.ok(xafCountries.has("CM"));
  assert.ok(xafCountries.has("BJ"));
  assert.ok(xafCountries.has("TG"));
});

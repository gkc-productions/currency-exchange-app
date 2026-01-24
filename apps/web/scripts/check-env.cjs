#!/usr/bin/env node

const required = ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_MARKETING_URL"];
const requireDb = process.argv.includes("--require-db");

if (requireDb) {
  required.push("DATABASE_URL");
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`
  );
  process.exit(1);
}

const urlKeys = ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_MARKETING_URL"];
const invalid = [];

for (const key of urlKeys) {
  try {
    new URL(process.env[key]);
  } catch {
    invalid.push(key);
  }
}

if (invalid.length) {
  console.error(`Invalid URL values for: ${invalid.join(", ")}`);
  process.exit(1);
}

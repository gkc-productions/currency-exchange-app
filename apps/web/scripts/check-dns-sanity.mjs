#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const hosts = ["clarisend.co", "www.clarisend.co", "api.clarisend.co"];

function resolveHost(host) {
  const result = spawnSync("dig", ["+short", host], { encoding: "utf8" });
  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error("dns:check requires `dig` to be installed.");
      process.exit(2);
    }
    throw result.error;
  }
  if (result.status !== 0) {
    console.error(`dig failed for ${host}: ${result.stderr.trim()}`);
    process.exit(result.status ?? 1);
  }

  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const results = hosts.map((host) => ({ host, records: resolveHost(host) }));
const invalid = results.flatMap(({ host, records }) =>
  records.filter((record) => record === "0.0.0.0").map((record) => ({ host, record })),
);

for (const { host, records } of results) {
  const printable = records.length > 0 ? records.join(", ") : "(no records)";
  console.log(`${host}: ${printable}`);
}

if (invalid.length > 0) {
  console.error("Invalid DNS placeholders found:");
  for (const entry of invalid) {
    console.error(`- ${entry.host}: ${entry.record}`);
  }
  process.exit(1);
}

console.log("DNS sanity check passed.");

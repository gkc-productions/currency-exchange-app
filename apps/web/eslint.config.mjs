import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const TARGET_DIRS = ["app", "src"];
const DEFAULT_FILES = ["**/*.{js,jsx,ts,tsx}"];

const scopeFiles = (patterns = DEFAULT_FILES) =>
  TARGET_DIRS.flatMap((dir) => patterns.map((pattern) => `${dir}/${pattern}`));

const scopeConfig = (config) => ({
  ...config,
  files: scopeFiles(config.files),
});

export default defineConfig([
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  ...nextVitals.map(scopeConfig),
  ...nextTs.map(scopeConfig),
]);

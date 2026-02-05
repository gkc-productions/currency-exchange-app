import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { isDevBypassEnabled } from "@/src/lib/security";

export function resolveCommitHash() {
  const envHash =
    process.env.GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA;
  if (envHash) {
    return envHash;
  }

  let dir = process.cwd();
  for (let i = 0; i < 5; i += 1) {
    const gitPath = join(dir, ".git");
    if (existsSync(gitPath)) {
      try {
        const headPath = join(gitPath, "HEAD");
        const head = readFileSync(headPath, "utf8").trim();
        if (head.startsWith("ref:")) {
          const refPath = head.replace("ref:", "").trim();
          const refFile = join(gitPath, refPath);
          if (existsSync(refFile)) {
            return readFileSync(refFile, "utf8").trim();
          }
        }
        return head;
      } catch {
        return null;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

export function getVersionInfo() {
  return {
    commitHash: resolveCommitHash(),
    buildTime: process.env.BUILD_TIME ?? null,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    devBypassEnabled: isDevBypassEnabled(),
    appBaseUrl: process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || null,
  };
}

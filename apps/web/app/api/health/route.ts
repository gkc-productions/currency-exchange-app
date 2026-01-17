import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";

function resolveCommitHash() {
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

export async function GET() {
  const response = {
    alive: true,
    dbOk: false,
    uptimeSeconds: Math.floor(process.uptime()),
    commitHash: resolveCommitHash(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    response.dbOk = true;
  } catch {
    response.dbOk = false;
  }

  return NextResponse.json(response, {
    status: response.dbOk ? 200 : 503,
  });
}

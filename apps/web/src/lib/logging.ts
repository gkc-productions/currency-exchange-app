type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  transferId?: string;
  route?: string;
  meta?: Record<string, unknown>;
};

function writeLog(level: LogLevel, message: string, payload: Omit<LogPayload, "level" | "message" | "timestamp"> = {}) {
  const entry: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export function logInfo(message: string, payload?: Omit<LogPayload, "level" | "message" | "timestamp">) {
  writeLog("info", message, payload);
}

export function logWarn(message: string, payload?: Omit<LogPayload, "level" | "message" | "timestamp">) {
  writeLog("warn", message, payload);
}

export function logError(message: string, payload?: Omit<LogPayload, "level" | "message" | "timestamp">) {
  writeLog("error", message, payload);
}

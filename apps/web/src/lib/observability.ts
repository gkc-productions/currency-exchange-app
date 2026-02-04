type LogMeta = Record<string, unknown>;

export function safeError(err: unknown) {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

export function logEvent(name: string, meta: LogMeta = {}) {
  const payload = {
    event: name,
    requestId: meta.requestId ?? null,
    ...meta,
  };
  console.info(JSON.stringify(payload));
}

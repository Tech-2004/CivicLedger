// Minimal structured logger. Swap for a platform logger later; keeping the
// surface tiny means call sites don't change.
type Fields = Record<string, unknown>;

function emit(level: string, msg: string, fields?: Fields) {
  const line = { level, msg, ts: new Date().toISOString(), ...fields };
  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](JSON.stringify(line));
}

export const log = {
  info: (msg: string, fields?: Fields) => emit("info", msg, fields),
  warn: (msg: string, fields?: Fields) => emit("warn", msg, fields),
  error: (msg: string, fields?: Fields) => emit("error", msg, fields),
};

import { HISTORY_RETENTION_MS } from "./constants";
import type { HistorySample, Vec2 } from "./types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Returns the recorded position at time `atMs`, interpolating between the
 * two nearest samples. `history` must be sorted ascending by `t` and
 * non-empty. Times before the first sample or after the last sample clamp
 * to that sample's position.
 */
export function sampleHistory(history: HistorySample[], atMs: number): Vec2 {
  const first = history[0];
  const last = history[history.length - 1];

  if (atMs <= first.t) return first.pos;
  if (atMs >= last.t) return last.pos;

  // Linear scan is fine: history is bounded to ~HISTORY_RETENTION_MS worth
  // of samples (a few hundred at most for a 60fps game loop).
  for (let i = 0; i < history.length - 1; i++) {
    const a = history[i];
    const b = history[i + 1];
    if (atMs >= a.t && atMs <= b.t) {
      const span = b.t - a.t;
      const t = span === 0 ? 0 : (atMs - a.t) / span;
      return { x: lerp(a.pos.x, b.pos.x, t), y: lerp(a.pos.y, b.pos.y, t) };
    }
  }

  return last.pos;
}

/** Appends a sample, then drops samples older than needed for interpolation. */
export function pushSample(history: HistorySample[], sample: HistorySample): HistorySample[] {
  const next = [...history, sample];
  const cutoff = sample.t - HISTORY_RETENTION_MS;

  let keepFrom = 0;
  for (let i = 0; i < next.length - 1; i++) {
    if (next[i + 1].t <= cutoff) {
      keepFrom = i + 1;
    } else {
      break;
    }
  }

  return keepFrom === 0 ? next : next.slice(keepFrom);
}

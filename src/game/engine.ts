import {
  PLAYER_RADIUS,
  PLAYER_SPEED,
  RESET_FLASH_MS,
  ROOM_TRANSITION_MS,
  SHADOW_DELAY_MS,
} from "./constants";
import { pushSample, sampleHistory } from "./history";
import type { GameState, GateDef, InputVector, PlateDef, Rect, RoomDef, Vec2 } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalize(v: InputVector): InputVector {
  const len = Math.hypot(v.x, v.y);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function circleRectOverlap(center: Vec2, radius: number, r: Rect): boolean {
  const closestX = clamp(center.x, r.x, r.x + r.w);
  const closestY = clamp(center.y, r.y, r.y + r.h);
  const dx = center.x - closestX;
  const dy = center.y - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function collides(pos: Vec2, radius: number, obstacles: Rect[], bounds: Rect): boolean {
  if (
    pos.x - radius < bounds.x ||
    pos.x + radius > bounds.x + bounds.w ||
    pos.y - radius < bounds.y ||
    pos.y + radius > bounds.y + bounds.h
  ) {
    return true;
  }
  return obstacles.some((rect) => circleRectOverlap(pos, radius, rect));
}

/** Moves a circle by `delta`, resolving one axis at a time against solid rects. */
export function moveCircle(pos: Vec2, delta: Vec2, radius: number, obstacles: Rect[], bounds: Rect): Vec2 {
  let next = { ...pos };

  const tryX = { x: next.x + delta.x, y: next.y };
  if (!collides(tryX, radius, obstacles, bounds)) next = tryX;

  const tryY = { x: next.x, y: next.y + delta.y };
  if (!collides(tryY, radius, obstacles, bounds)) next = tryY;

  return next;
}

export function computePlateActive(
  plates: PlateDef[],
  player: Vec2,
  shadow: Vec2,
  shadowAlive: boolean,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const plate of plates) {
    const playerOn = circleRectOverlap(player, PLAYER_RADIUS, plate.rect);
    const shadowOn = shadowAlive && circleRectOverlap(shadow, PLAYER_RADIUS, plate.rect);
    result[plate.id] = playerOn || shadowOn;
  }
  return result;
}

export function computeGateOpen(gates: GateDef[], plateActive: Record<string, boolean>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const gate of gates) {
    result[gate.id] = gate.requiredPlateIds.every((id) => plateActive[id]);
  }
  return result;
}

export function createInitialState(rooms: RoomDef[], startRoomIndex = 0): GameState {
  return spawnState(rooms, clamp(startRoomIndex, 0, rooms.length - 1));
}

/**
 * Parses a 1-indexed `?room=N` query value into a 0-indexed room index,
 * clamped to a valid range. Returns 0 (the first room) for anything missing
 * or unparseable, so a malformed/absent query param is a silent no-op.
 */
export function resolveStartRoomIndex(roomParam: string | null, roomCount: number): number {
  if (roomParam === null) return 0;
  const parsed = Number.parseInt(roomParam, 10);
  if (!Number.isFinite(parsed)) return 0;
  return clamp(parsed - 1, 0, roomCount - 1);
}

function spawnState(rooms: RoomDef[], roomIndex: number): GameState {
  const room = rooms[roomIndex];
  const plateActive = computePlateActive(room.plates, room.spawn, room.spawn, false);
  const gateOpen = computeGateOpen(room.gates, plateActive);

  return {
    roomIndex,
    phase: "playing",
    player: room.spawn,
    shadow: room.spawn,
    shadowAlive: false,
    history: [{ t: 0, pos: room.spawn }],
    elapsedMs: 0,
    plateActive,
    gateOpen,
    transitionRemainingMs: 0,
  };
}

export function stepGame(state: GameState, rooms: RoomDef[], input: InputVector, dtMs: number): GameState {
  if (state.phase === "gameComplete") return state;

  if (state.phase === "resetting") {
    const remaining = state.transitionRemainingMs - dtMs;
    if (remaining > 0) return { ...state, transitionRemainingMs: remaining };
    return spawnState(rooms, state.roomIndex);
  }

  if (state.phase === "roomComplete") {
    const remaining = state.transitionRemainingMs - dtMs;
    if (remaining > 0) return { ...state, transitionRemainingMs: remaining };
    const room = rooms[state.roomIndex];
    if (room.isFinal) {
      return { ...state, phase: "gameComplete", transitionRemainingMs: 0 };
    }
    return spawnState(rooms, state.roomIndex + 1);
  }

  // phase === "playing"
  const room = rooms[state.roomIndex];
  const elapsedMs = state.elapsedMs + dtMs;

  const dir = normalize(input);
  const dtSec = dtMs / 1000;
  const delta = { x: dir.x * PLAYER_SPEED * dtSec, y: dir.y * PLAYER_SPEED * dtSec };

  const solidRects = [...room.walls, ...room.gates.filter((g) => !state.gateOpen[g.id]).map((g) => g.rect)];

  const player = moveCircle(state.player, delta, PLAYER_RADIUS, solidRects, room.bounds);
  const history = pushSample(state.history, { t: elapsedMs, pos: player });

  const shadowAlive = elapsedMs >= SHADOW_DELAY_MS;
  const shadow = shadowAlive ? sampleHistory(history, elapsedMs - SHADOW_DELAY_MS) : room.spawn;

  const plateActive = computePlateActive(room.plates, player, shadow, shadowAlive);
  const gateOpen = computeGateOpen(room.gates, plateActive);

  const hitHazard = room.hazards.some((h) => circleRectOverlap(player, PLAYER_RADIUS, h.rect));
  const hitShadow = shadowAlive && distance(player, shadow) < PLAYER_RADIUS * 2;

  const base: GameState = {
    ...state,
    player,
    shadow,
    shadowAlive,
    history,
    elapsedMs,
    plateActive,
    gateOpen,
  };

  if (hitHazard || hitShadow) {
    return { ...base, phase: "resetting", transitionRemainingMs: RESET_FLASH_MS };
  }

  if (pointInRect(player, room.exit)) {
    return { ...base, phase: "roomComplete", transitionRemainingMs: ROOM_TRANSITION_MS };
  }

  return base;
}

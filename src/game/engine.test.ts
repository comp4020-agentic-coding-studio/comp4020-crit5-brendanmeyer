import { describe, expect, it } from "vitest";
import { PLAYER_RADIUS, SHADOW_DELAY_MS } from "./constants";
import {
  circleRectOverlap,
  computeGateOpen,
  computePlateActive,
  createInitialState,
  moveCircle,
  resolveStartRoomIndex,
  stepGame,
} from "./engine";
import { sampleHistory } from "./history";
import type { GateDef, HistorySample, PlateDef, RoomDef } from "./types";

describe("shadow delay", () => {
  it("occupies the player's position from ~2 seconds earlier", () => {
    const A = { x: 0, y: 0 };
    const B = { x: 10, y: 0 };
    const C = { x: 20, y: 0 };
    const history: HistorySample[] = [
      { t: 0, pos: A },
      { t: 1000, pos: B },
      { t: 2000, pos: C },
    ];

    // At time 2000ms, "2 seconds earlier" is time 0 — the shadow should be at A.
    expect(sampleHistory(history, 2000 - SHADOW_DELAY_MS)).toEqual(A);
  });

  it("interpolates between samples rather than snapping", () => {
    const history: HistorySample[] = [
      { t: 0, pos: { x: 0, y: 0 } },
      { t: 1000, pos: { x: 100, y: 0 } },
    ];
    expect(sampleHistory(history, 500)).toEqual({ x: 50, y: 0 });
  });

  it("stays inert (at spawn) before enough history exists", () => {
    const rooms: RoomDef[] = [makeRoom({})];
    let state = createInitialState(rooms);
    state = stepGame(state, rooms, { x: 1, y: 0 }, 500);
    expect(state.shadowAlive).toBe(false);
    expect(state.shadow).toEqual(rooms[0].spawn);
  });
});

describe("collision", () => {
  it("resets the room when the player touches the live shadow", () => {
    const rooms: RoomDef[] = [makeRoom({ spawn: { x: 60, y: 250 } })];
    let state = createInitialState(rooms);

    // Walk right for 2.5s: the shadow wakes up (at ~2s) far behind, near
    // spawn, while the player is well ahead.
    for (let i = 0; i < 250; i++) state = stepGame(state, rooms, { x: 1, y: 0 }, 10);
    expect(state.shadowAlive).toBe(true);
    expect(state.player.x).toBeGreaterThan(300);

    // Reverse and walk straight back — directly into the shadow, which is
    // replaying that same outbound walk from behind.
    for (let i = 0; i < 200 && state.phase === "playing"; i++) {
      state = stepGame(state, rooms, { x: -1, y: 0 }, 10);
    }

    expect(state.phase).toBe("resetting");
  });

  it("does not collide with a shadow that isn't alive yet", () => {
    expect(circleRectOverlap).toBeTypeOf("function"); // sanity: helper exists
    const rooms: RoomDef[] = [makeRoom({ spawn: { x: 60, y: 250 } })];
    const state = createInitialState(rooms);
    // Player and shadow start at the exact same point (t=0) — must not
    // immediately be treated as a collision.
    expect(state.shadowAlive).toBe(false);
  });

  it("resets the room when the player touches a hazard", () => {
    const rooms: RoomDef[] = [
      makeRoom({
        spawn: { x: 60, y: 250 },
        hazards: [{ rect: { x: 200, y: 230, w: 40, h: 40 } }],
      }),
    ];
    let state = createInitialState(rooms);
    for (let i = 0; i < 200 && state.phase === "playing"; i++) {
      state = stepGame(state, rooms, { x: 1, y: 0 }, 10);
    }
    expect(state.phase).toBe("resetting");
  });

  it("returns to spawn and clears history after a reset", () => {
    const rooms: RoomDef[] = [makeRoom({ spawn: { x: 60, y: 250 } })];
    let state = createInitialState(rooms);
    for (let i = 0; i < 250; i++) state = stepGame(state, rooms, { x: 1, y: 0 }, 10);
    for (let i = 0; i < 200 && state.phase === "playing"; i++) {
      state = stepGame(state, rooms, { x: -1, y: 0 }, 10);
    }
    expect(state.phase).toBe("resetting");

    // Advance past the reset flash.
    state = stepGame(state, rooms, { x: 0, y: 0 }, 1000);
    expect(state.phase).toBe("playing");
    expect(state.player).toEqual(rooms[0].spawn);
    expect(state.history).toEqual([{ t: 0, pos: rooms[0].spawn }]);
  });
});

describe("gate closing", () => {
  it("resets the room when a gate swings shut while the player's center is still inside it", () => {
    const rooms: RoomDef[] = [
      makeRoom({
        spawn: { x: 140, y: 250 },
        plates: [{ id: "p1", rect: { x: 100, y: 230, w: 50, h: 40 } }],
        gates: [{ id: "g1", rect: { x: 160, y: 230, w: 10, h: 40 }, requiredPlateIds: ["p1"] }],
      }),
    ];
    let state = createInitialState(rooms);

    // Stand still for a tick so the gate reads as open while the player is
    // still on the plate.
    state = stepGame(state, rooms, { x: 0, y: 0 }, 1);
    expect(state.gateOpen.g1).toBe(true);

    // One big step carries the player straight off the plate and into the
    // gate's footprint in a single tick: movement resolves against last
    // tick's open gate (so nothing blocks it), but the plate is no longer
    // held by the new position, so the gate reads closed with the player's
    // center still inside it.
    state = stepGame(state, rooms, { x: 1, y: 0 }, 156.25);
    expect(state.phase).toBe("resetting");
  });

  it("does not reset when the player simply bumps into a still-closed gate", () => {
    const rooms: RoomDef[] = [
      makeRoom({
        spawn: { x: 60, y: 250 },
        gates: [{ id: "g1", rect: { x: 160, y: 230, w: 10, h: 40 }, requiredPlateIds: ["unreachable"] }],
      }),
    ];
    let state = createInitialState(rooms);
    for (let i = 0; i < 100; i++) state = stepGame(state, rooms, { x: 1, y: 0 }, 16);
    expect(state.phase).toBe("playing");
  });
});

describe("pressure plates and gates", () => {
  const plate: PlateDef = { id: "p1", rect: { x: 100, y: 100, w: 50, h: 50 } };
  const gate: GateDef = { id: "g1", rect: { x: 0, y: 0, w: 0, h: 0 }, requiredPlateIds: ["p1"] };

  it("activates while the player stands on it", () => {
    const active = computePlateActive([plate], { x: 125, y: 125 }, { x: 0, y: 0 }, false);
    expect(active.p1).toBe(true);
  });

  it("activates while the (live) shadow stands on it, even off the player", () => {
    const active = computePlateActive([plate], { x: 0, y: 0 }, { x: 125, y: 125 }, true);
    expect(active.p1).toBe(true);
  });

  it("ignores the shadow's position while the shadow isn't alive", () => {
    const active = computePlateActive([plate], { x: 0, y: 0 }, { x: 125, y: 125 }, false);
    expect(active.p1).toBe(false);
  });

  it("opens its gate only once every required plate is active", () => {
    const twoPlateGate: GateDef = { ...gate, requiredPlateIds: ["p1", "p2"] };
    const bothActive = computeGateOpen([twoPlateGate], { p1: true, p2: true });
    const oneActive = computeGateOpen([twoPlateGate], { p1: true, p2: false });
    expect(bothActive.g1).toBe(true);
    expect(oneActive.g1).toBe(false);
  });
});

describe("movement", () => {
  it("blocks the player from moving through a wall", () => {
    const wall = { x: 100, y: 0, w: 20, h: 500 };
    const next = moveCircle({ x: 80, y: 250 }, { x: 50, y: 0 }, PLAYER_RADIUS, [wall], { x: 0, y: 0, w: 900, h: 500 });
    expect(next.x).toBeLessThan(100 - PLAYER_RADIUS + 1);
  });

  it("keeps the player inside the room bounds", () => {
    const bounds = { x: 0, y: 0, w: 900, h: 500 };
    const next = moveCircle({ x: 20, y: 250 }, { x: -50, y: 0 }, PLAYER_RADIUS, [], bounds);
    expect(next.x).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });
});

describe("room completion", () => {
  it("reaching the exit enters roomComplete, then advances to the next room", () => {
    const rooms: RoomDef[] = [
      makeRoom({ spawn: { x: 10, y: 10 }, exit: { x: 0, y: 0, w: 20, h: 20 } }),
      makeRoom({ spawn: { x: 5, y: 5 }, exit: { x: 0, y: 0, w: 20, h: 20 } }),
    ];
    let state = createInitialState(rooms);
    // Already standing in the exit rect — one tick should trigger completion.
    state = stepGame(state, rooms, { x: 0, y: 0 }, 16);
    expect(state.phase).toBe("roomComplete");

    state = stepGame(state, rooms, { x: 0, y: 0 }, 1000);
    expect(state.phase).toBe("playing");
    expect(state.roomIndex).toBe(1);
    expect(state.player).toEqual(rooms[1].spawn);
  });

  it("finishing the final room ends the game", () => {
    const rooms: RoomDef[] = [makeRoom({ spawn: { x: 10, y: 10 }, exit: { x: 0, y: 0, w: 20, h: 20 }, isFinal: true })];
    let state = createInitialState(rooms);
    state = stepGame(state, rooms, { x: 0, y: 0 }, 16);
    expect(state.phase).toBe("roomComplete");
    state = stepGame(state, rooms, { x: 0, y: 0 }, 1000);
    expect(state.phase).toBe("gameComplete");
  });
});

describe("debug room skip", () => {
  it("resolves a 1-indexed ?room= value to a 0-indexed room index", () => {
    expect(resolveStartRoomIndex("3", 16)).toBe(2);
  });

  it("falls back to the first room when the param is missing or unparseable", () => {
    expect(resolveStartRoomIndex(null, 16)).toBe(0);
    expect(resolveStartRoomIndex("not-a-number", 16)).toBe(0);
  });

  it("clamps out-of-range values into the valid room range", () => {
    expect(resolveStartRoomIndex("0", 16)).toBe(0);
    expect(resolveStartRoomIndex("-5", 16)).toBe(0);
    expect(resolveStartRoomIndex("999", 16)).toBe(15);
  });

  it("createInitialState spawns directly into the requested room", () => {
    const rooms: RoomDef[] = [
      makeRoom({ id: "a", spawn: { x: 10, y: 10 } }),
      makeRoom({ id: "b", spawn: { x: 20, y: 20 } }),
      makeRoom({ id: "c", spawn: { x: 30, y: 30 } }),
    ];
    const state = createInitialState(rooms, 2);
    expect(state.roomIndex).toBe(2);
    expect(state.player).toEqual(rooms[2].spawn);
  });
});

function makeRoom(overrides: Partial<RoomDef>): RoomDef {
  return {
    id: "test-room",
    bounds: { x: 0, y: 0, w: 900, h: 500 },
    walls: [],
    plates: [],
    gates: [],
    hazards: [],
    spawn: { x: 450, y: 250 },
    exit: { x: 850, y: 450, w: 30, h: 30 },
    ...overrides,
  };
}

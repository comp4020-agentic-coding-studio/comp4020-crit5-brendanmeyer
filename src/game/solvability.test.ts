import { describe, expect, it } from "vitest";
import { createInitialState, stepGame } from "./engine";
import { rooms } from "./rooms";
import type { GamePhase, GameState, InputVector, RoomDef } from "./types";

const DT = 16; // ~60fps fixed step, matches the renderer's frame budget

interface Segment {
  input: InputVector;
  durationMs: number;
}

/**
 * Runs a scripted input sequence through one room, stepping at a fixed dt.
 * Stops as soon as the room resets (failure) or completes — except for a
 * final room, where it keeps stepping through the completion transition so
 * `gameComplete` actually lands.
 */
function play(room: RoomDef, script: Segment[]): GameState {
  let state = createInitialState([room]);
  for (const segment of script) {
    let remaining = segment.durationMs;
    while (remaining > 0 && state.phase !== "gameComplete") {
      const step = Math.min(DT, remaining);
      state = stepGame(state, [room], segment.input, step);
      remaining -= step;
      if (state.phase === "resetting") return state;
      if (state.phase === ("roomComplete" satisfies GamePhase) && !room.isFinal) return state;
    }
  }
  while (state.phase === "roomComplete") {
    state = stepGame(state, [room], { x: 0, y: 0 }, DT);
  }
  return state;
}

const RIGHT: InputVector = { x: 1, y: 0 };
const LEFT: InputVector = { x: -1, y: 0 };
const UP: InputVector = { x: 0, y: -1 };
const DOWN: InputVector = { x: 0, y: 1 };

describe("room solvability", () => {
  it("room 1: walking straight to the exit never resets", () => {
    const result = play(rooms[0], [{ input: RIGHT, durationMs: 6000 }]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 2: walking straight there bumps the closed gate, then it opens on its own", () => {
    const result = play(rooms[1], [{ input: RIGHT, durationMs: 8000 }]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 3: walking straight there still needs the plate-A echo to open the AND gate", () => {
    const result = play(rooms[2], [{ input: RIGHT, durationMs: 8000 }]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 4: touching the plate then rushing straight back resets on the shadow", () => {
    // The naive "just go there and back" attempt should fail — this is the
    // room's whole teaching point, so a broken room here would be a room
    // that's accidentally already safe.
    const result = play(rooms[3], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 5000 },
    ]);
    expect(result.phase).toBe("resetting");
  });

  it("room 4: dodging into the nook on the way back reaches the exit", () => {
    const result = play(rooms[3], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 700 },
      { input: UP, durationMs: 600 },
      { input: LEFT, durationMs: 500 },
      { input: DOWN, durationMs: 600 },
      { input: LEFT, durationMs: 3000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 5: cross the plate, then head up the branch to the exit", () => {
    const result = play(rooms[4], [
      { input: RIGHT, durationMs: 3700 },
      { input: UP, durationMs: 2600 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 6: the combo room's plate/gate/hazard sequence completes", () => {
    const result = play(rooms[5], [
      { input: RIGHT, durationMs: 1700 },
      { input: UP, durationMs: 250 },
      { input: RIGHT, durationMs: 10000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 7: threshold — a hazard sits between two independent bump-and-waits", () => {
    const result = play(rooms[6], [
      { input: RIGHT, durationMs: 1700 },
      { input: UP, durationMs: 269 },
      { input: RIGHT, durationMs: 9000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 7: rushing straight through without dodging hits the hazard", () => {
    const result = play(rooms[6], [{ input: RIGHT, durationMs: 9000 }]);
    expect(result.phase).toBe("resetting");
  });

  it("room 8: shielded plate — the AND-gate timing and the hazard dodge must be solved together", () => {
    const result = play(rooms[7], [
      { input: UP, durationMs: 269 },
      { input: RIGHT, durationMs: 9000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 8: rushing straight through without dodging hits the hazard", () => {
    const result = play(rooms[7], [{ input: RIGHT, durationMs: 9000 }]);
    expect(result.phase).toBe("resetting");
  });

  it("room 9: guarded return — the far plate and a plate beside the gate must both be active on the way back", () => {
    const result = play(rooms[8], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 700 },
      { input: UP, durationMs: 600 },
      { input: LEFT, durationMs: 500 },
      { input: DOWN, durationMs: 600 },
      { input: LEFT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 9: rushing straight back resets on the shadow", () => {
    const result = play(rooms[8], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 5000 },
    ]);
    expect(result.phase).toBe("resetting");
  });

  it("room 10: second branch — the plate now sits past the junction, so the shadow crosses it later", () => {
    const result = play(rooms[9], [
      { input: RIGHT, durationMs: 4600 },
      { input: LEFT, durationMs: 800 },
      { input: UP, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 11: needle's eye — weaving through staggered hazards to the plate and gate", () => {
    const result = play(rooms[10], [
      { input: RIGHT, durationMs: 375 },
      { input: DOWN, durationMs: 281 },
      { input: RIGHT, durationMs: 563 },
      { input: UP, durationMs: 531 },
      { input: RIGHT, durationMs: 813 },
      { input: DOWN, durationMs: 531 },
      { input: RIGHT, durationMs: 625 },
      { input: UP, durationMs: 531 },
      { input: RIGHT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 11: rushing straight through the hazard row resets", () => {
    const result = play(rooms[10], [{ input: RIGHT, durationMs: 12000 }]);
    expect(result.phase).toBe("resetting");
  });

  it("room 12: chain run — a wait, then a hazard, then a two-plate AND-gate, back to back", () => {
    const result = play(rooms[11], [
      { input: RIGHT, durationMs: 1450 },
      { input: UP, durationMs: 269 },
      { input: RIGHT, durationMs: 9000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 12: rushing straight through without dodging hits the hazard", () => {
    const result = play(rooms[11], [{ input: RIGHT, durationMs: 9000 }]);
    expect(result.phase).toBe("resetting");
  });

  it("room 13: figure eight — the intended route crosses the player's own path twice", () => {
    const result = play(rooms[12], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 700 },
      { input: UP, durationMs: 600 },
      { input: LEFT, durationMs: 500 },
      { input: DOWN, durationMs: 600 },
      { input: LEFT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 13: rushing the naive route resets on the shadow", () => {
    const result = play(rooms[12], [
      { input: UP, durationMs: 950 },
      { input: RIGHT, durationMs: 950 },
      { input: LEFT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("resetting");
  });

  it("room 14: after the door — the hazard is the last obstacle, not the first", () => {
    const result = play(rooms[13], [
      { input: RIGHT, durationMs: 2200 },
      { input: UP, durationMs: 269 },
      { input: RIGHT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 14: rushing straight through without dodging hits the hazard", () => {
    const result = play(rooms[13], [{ input: RIGHT, durationMs: 9000 }]);
    expect(result.phase).toBe("resetting");
  });

  it("room 15: gauntlet — an AND-gate followed by a two-hazard weave", () => {
    const result = play(rooms[14], [
      { input: RIGHT, durationMs: 2400 },
      { input: DOWN, durationMs: 281 },
      { input: RIGHT, durationMs: 1331 },
      { input: UP, durationMs: 531 },
      { input: RIGHT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("roomComplete");
  });

  it("room 16: the last door — the full final sequence, including a hazard weave, ends the game", () => {
    const result = play(rooms[15], [
      { input: RIGHT, durationMs: 1200 },
      { input: UP, durationMs: 269 },
      { input: RIGHT, durationMs: 6000 },
    ]);
    expect(result.phase).toBe("gameComplete");
  });

  it("room 16: rushing straight through the hazard weave resets", () => {
    const result = play(rooms[15], [{ input: RIGHT, durationMs: 14000 }]);
    expect(result.phase).toBe("resetting");
  });
});

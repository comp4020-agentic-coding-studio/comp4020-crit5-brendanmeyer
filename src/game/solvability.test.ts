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

  it("room 6: the full final sequence, including a hazard dodge, ends the game", () => {
    const result = play(rooms[5], [
      { input: RIGHT, durationMs: 1700 },
      { input: UP, durationMs: 250 },
      { input: RIGHT, durationMs: 10000 },
    ]);
    expect(result.phase).toBe("gameComplete");
  });
});

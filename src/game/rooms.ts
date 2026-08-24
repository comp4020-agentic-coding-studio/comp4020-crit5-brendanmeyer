import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import type { RoomDef } from "./types";

const FULL_BOUNDS = { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT };

// Room 1 — Discover the shadow. Open floor, nothing but an obvious glowing
// doorway on the far side. Safe by construction: walking straight there
// keeps a constant ~2s gap ahead of the shadow, which only ever closes that
// gap if the player reverses into it.
const room1: RoomDef = {
  id: "discover",
  bounds: FULL_BOUNDS,
  walls: [],
  plates: [],
  gates: [],
  hazards: [],
  spawn: { x: 60, y: 250 },
  exit: { x: 820, y: 190, w: 60, h: 120 },
};

// Room 2 — Pressure plate. A single corridor: touch the plate, the gate
// just ahead is too far to reach before the shadow's echo arrives, so the
// natural first attempt is to bump the closed gate and wait for it to open.
const CORRIDOR_TOP = 190;
const CORRIDOR_BOTTOM = 310;
const corridorWalls = [
  { x: 0, y: 0, w: CANVAS_WIDTH, h: CORRIDOR_TOP },
  { x: 0, y: CORRIDOR_BOTTOM, w: CANVAS_WIDTH, h: CANVAS_HEIGHT - CORRIDOR_BOTTOM },
];

const room2: RoomDef = {
  id: "plate",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [{ id: "p1", rect: { x: 150, y: 205, w: 70, h: 100 } }],
  gates: [{ id: "g1", rect: { x: 420, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p1"] }],
  hazards: [],
  spawn: { x: 60, y: 250 },
  exit: { x: 820, y: 190, w: 60, h: 120 },
};

// Room 3 — Two places at once. Plate A is a detour early in the corridor;
// plate B sits immediately before the gate. The gate needs both — walking
// straight there from A arrives before the shadow's echo reaches A, so the
// gate is still closed and blocks you (same bump as room 2); only once the
// shadow reaches A while you're still parked on B does it open.
const room3: RoomDef = {
  id: "two-places",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "a", rect: { x: 150, y: 205, w: 90, h: 100 } },
    { id: "b", rect: { x: 300, y: 205, w: 150, h: 100 } },
  ],
  gates: [
    {
      id: "g2",
      rect: { x: 394, y: CORRIDOR_TOP, w: 40, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["a", "b"],
    },
  ],
  hazards: [],
  spawn: { x: 60, y: 250 },
  exit: { x: 820, y: 190, w: 60, h: 120 },
};

// Room 4 — Shadow collision. Spawn sits in a small pocket below the
// corridor (so the shadow's spawn-point wake-up never lands on the travel
// line itself); the first move is a short step up into the corridor.
// Reaching the exit means walking out to a plate, then heading back toward
// a gate on the way. The return leg crosses back through ground the shadow
// is still forward-replaying, so a head-on meeting is the natural first
// outcome. A nook beside the crossing point gives room to step aside once
// the player understands why it happened. The gate sits clear of both the
// top nook and the bottom spawn pocket, with its own sealed column above
// and below, so neither gap can be walked around it.
const ROOM4_TOP = 190;
const ROOM4_BOTTOM = 310;
const ROOM4_GATE_X = 560;
const room4: RoomDef = {
  id: "collision",
  bounds: FULL_BOUNDS,
  walls: [
    { x: 0, y: 0, w: 440, h: ROOM4_TOP },
    { x: 720, y: 0, w: CANVAS_WIDTH - 720, h: ROOM4_TOP },
    { x: ROOM4_GATE_X, y: 0, w: 20, h: ROOM4_TOP },
    { x: 0, y: ROOM4_BOTTOM, w: 600, h: CANVAS_HEIGHT - ROOM4_BOTTOM },
    { x: 740, y: ROOM4_BOTTOM, w: CANVAS_WIDTH - 740, h: CANVAS_HEIGHT - ROOM4_BOTTOM },
  ],
  plates: [{ id: "p4", rect: { x: 700, y: 225, w: 100, h: 60 } }],
  gates: [
    { id: "g4", rect: { x: ROOM4_GATE_X, y: ROOM4_TOP, w: 20, h: ROOM4_BOTTOM - ROOM4_TOP }, requiredPlateIds: ["p4"] },
  ],
  hazards: [],
  spawn: { x: 665, y: 400 },
  exit: { x: 480, y: 200, w: 60, h: 100 },
};

// Room 5 — Crossing paths. A bottom corridor leads to a plate, then a
// branch climbs to the gate/exit above. The obvious place to wait for the
// gate is right at the branch junction — which is exactly where the
// shadow, still replaying the walk out to the plate, comes through. A nook
// just before the junction gives a safe place to wait instead.
const room5: RoomDef = {
  id: "crossing",
  bounds: FULL_BOUNDS,
  walls: [
    { x: 0, y: 0, w: 600, h: 380 },
    { x: 700, y: 0, w: CANVAS_WIDTH - 700, h: 380 },
    { x: 0, y: 460, w: 520, h: CANVAS_HEIGHT - 460 },
    { x: 600, y: 460, w: CANVAS_WIDTH - 600, h: CANVAS_HEIGHT - 460 },
  ],
  plates: [{ id: "p5", rect: { x: 400, y: 390, w: 70, h: 70 } }],
  gates: [{ id: "g5", rect: { x: 620, y: 280, w: 60, h: 20 }, requiredPlateIds: ["p5"] }],
  hazards: [],
  spawn: { x: 60, y: 420 },
  exit: { x: 620, y: 20, w: 60, h: 40 },
};

// Room 6 — Final puzzle. Sequential plate/gate, then an AND gate needing a
// plate visited earlier alongside one right before the exit — no new
// mechanic, just the earlier lessons stacked in one longer room.
const room6: RoomDef = {
  id: "finale",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p6a", rect: { x: 140, y: 205, w: 70, h: 100 } },
    { id: "p6b", rect: { x: 430, y: 205, w: 90, h: 100 } },
    { id: "p6c", rect: { x: 700, y: 205, w: 130, h: 100 } },
  ],
  gates: [
    { id: "g6a", rect: { x: 320, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p6a"] },
    {
      id: "g6b",
      rect: { x: 770, y: CORRIDOR_TOP, w: 30, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["p6b", "p6c"],
    },
  ],
  hazards: [{ rect: { x: 370, y: 245, w: 40, h: 65 } }],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 195, w: 50, h: 110 },
  isFinal: true,
};

export const rooms: RoomDef[] = [room1, room2, room3, room4, room5, room6];

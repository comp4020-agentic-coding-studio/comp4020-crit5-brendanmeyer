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
  id: "combo",
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
};

// Room 7 — Threshold. Two independent single-plate/gate waits, like room 2,
// but a static hazard sits in the corridor between them — the first real
// pairing of a hazard with a plain bump-and-wait, at the smallest possible
// scale, before needle's-eye asks for a longer weave.
const room7: RoomDef = {
  id: "threshold",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p7a", rect: { x: 120, y: 205, w: 70, h: 100 } },
    { id: "p7b", rect: { x: 560, y: 205, w: 70, h: 100 } },
  ],
  gates: [
    { id: "g7a", rect: { x: 340, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p7a"] },
    { id: "g7b", rect: { x: 760, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p7b"] },
  ],
  hazards: [{ rect: { x: 430, y: 225, w: 40, h: 60 } }],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 8 — Shielded plate. One AND-gate needing two plates, same as room 3,
// but a hazard sits directly between them — the plate-timing puzzle and a
// dodge now have to be solved in the same breath instead of one after the
// other.
const room8: RoomDef = {
  id: "shielded-plate",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p8a", rect: { x: 200, y: 205, w: 80, h: 100 } },
    { id: "p8b", rect: { x: 400, y: 205, w: 200, h: 100 } },
  ],
  gates: [
    {
      id: "g8",
      rect: { x: 480, y: CORRIDOR_TOP, w: 40, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["p8a", "p8b"],
    },
  ],
  hazards: [{ rect: { x: 340, y: 225, w: 40, h: 60 } }],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 9 — Guarded return. Room 4's collision/backtrack pocket, but the
// single gate is now an AND-gate: it needs the far plate touched on the way
// out (p9) *and* a second plate parked beside the gate on the way back
// (p9b). The shadow-dodge and the plate-timing puzzle now have to be solved
// together, not one then the other.
const ROOM9_TOP = 190;
const ROOM9_BOTTOM = 310;
const ROOM9_GATE_X = 640;
const room9: RoomDef = {
  id: "guarded-return",
  bounds: FULL_BOUNDS,
  walls: [
    { x: 0, y: 0, w: 480, h: ROOM9_TOP },
    { x: 760, y: 0, w: CANVAS_WIDTH - 760, h: ROOM9_TOP },
    { x: ROOM9_GATE_X, y: 0, w: 20, h: ROOM9_TOP },
    { x: 0, y: ROOM9_BOTTOM, w: 640, h: CANVAS_HEIGHT - ROOM9_BOTTOM },
    { x: 780, y: ROOM9_BOTTOM, w: CANVAS_WIDTH - 780, h: CANVAS_HEIGHT - ROOM9_BOTTOM },
  ],
  plates: [
    { id: "p9", rect: { x: 740, y: 225, w: 100, h: 60 } },
    { id: "p9b", rect: { x: 665, y: 205, w: 70, h: 100 } },
  ],
  gates: [
    {
      id: "g9",
      rect: { x: ROOM9_GATE_X, y: ROOM9_TOP, w: 20, h: ROOM9_BOTTOM - ROOM9_TOP },
      requiredPlateIds: ["p9", "p9b"],
    },
  ],
  hazards: [],
  spawn: { x: 705, y: 400 },
  exit: { x: 440, y: 200, w: 60, h: 100 },
};

// Room 10 — Second branch. Room 5's shape again (bottom corridor, branch up
// to the gate/exit) but the plate sits further from the branch, so the
// shadow reaches the junction at a different, less forgiving moment.
const room10: RoomDef = {
  id: "second-branch",
  bounds: FULL_BOUNDS,
  walls: [
    { x: 0, y: 0, w: 600, h: 380 },
    { x: 700, y: 0, w: CANVAS_WIDTH - 700, h: 380 },
    { x: 0, y: 460, w: 520, h: CANVAS_HEIGHT - 460 },
    { x: 600, y: 460, w: CANVAS_WIDTH - 600, h: CANVAS_HEIGHT - 460 },
  ],
  plates: [{ id: "p10", rect: { x: 650, y: 390, w: 200, h: 70 } }],
  gates: [{ id: "g10", rect: { x: 620, y: 280, w: 60, h: 20 }, requiredPlateIds: ["p10"] }],
  hazards: [],
  spawn: { x: 60, y: 420 },
  exit: { x: 620, y: 20, w: 60, h: 40 },
};

// Room 11 — Needle's eye. A corridor lined with staggered static hazards
// that must be woven through, ending in a plate/gate. Tests precise
// continuous movement rather than new timing logic.
const room11: RoomDef = {
  id: "needles-eye",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [{ id: "p11", rect: { x: 700, y: 205, w: 90, h: 100 } }],
  gates: [
    { id: "g11", rect: { x: 830, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p11"] },
  ],
  hazards: [
    { rect: { x: 150, y: CORRIDOR_TOP, w: 30, h: 70 } },
    { rect: { x: 260, y: 250, w: 30, h: 70 } },
    { rect: { x: 370, y: CORRIDOR_TOP, w: 30, h: 70 } },
    { rect: { x: 480, y: 250, w: 30, h: 70 } },
  ],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 12 — Chain run. Three escalating stages back to back: a plain
// single-plate wait (room 2), then a hazard to dodge, then a two-plate
// AND-gate (room 3) right after it — everything taught so far, in sequence,
// rather than one lesson repeated twice.
const room12: RoomDef = {
  id: "chain-run",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p12a", rect: { x: 120, y: 205, w: 70, h: 100 } },
    { id: "p12b", rect: { x: 480, y: 205, w: 80, h: 100 } },
    { id: "p12c", rect: { x: 650, y: 205, w: 180, h: 100 } },
  ],
  gates: [
    { id: "g12a", rect: { x: 300, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p12a"] },
    {
      id: "g12b",
      rect: { x: 790, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["p12b", "p12c"],
    },
  ],
  hazards: [{ rect: { x: 380, y: 225, w: 40, h: 60 } }],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 13 — Figure eight. An arena where the intended route crosses the
// player's own recorded path twice — two separate dodge moments in one
// room, extending room 9's single-crossing lesson.
const ROOM13_TOP = 190;
const ROOM13_BOTTOM = 310;
const ROOM13_GATE_X = 560;
const room13: RoomDef = {
  id: "figure-eight",
  bounds: FULL_BOUNDS,
  walls: [
    { x: 0, y: 0, w: 440, h: ROOM13_TOP },
    { x: 720, y: 0, w: CANVAS_WIDTH - 720, h: ROOM13_TOP },
    { x: ROOM13_GATE_X, y: 0, w: 20, h: ROOM13_TOP },
    { x: 0, y: ROOM13_BOTTOM, w: 600, h: CANVAS_HEIGHT - ROOM13_BOTTOM },
    { x: 740, y: ROOM13_BOTTOM, w: CANVAS_WIDTH - 740, h: CANVAS_HEIGHT - ROOM13_BOTTOM },
  ],
  plates: [{ id: "p13", rect: { x: 700, y: 225, w: 100, h: 60 } }],
  gates: [
    { id: "g13", rect: { x: ROOM13_GATE_X, y: ROOM13_TOP, w: 20, h: ROOM13_BOTTOM - ROOM13_TOP }, requiredPlateIds: ["p13"] },
  ],
  hazards: [],
  spawn: { x: 665, y: 400 },
  exit: { x: 60, y: 200, w: 60, h: 100 },
};

// Room 14 — After the door. A plain single-plate bump-and-wait, like room 2,
// but the hazard comes after the gate this time instead of before it — the
// last obstacle standing between the player and the exit, once the door is
// finally open.
const room14: RoomDef = {
  id: "after-the-door",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [{ id: "p14a", rect: { x: 150, y: 205, w: 70, h: 100 } }],
  gates: [
    { id: "g14", rect: { x: 420, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p14a"] },
  ],
  hazards: [{ rect: { x: 650, y: 225, w: 40, h: 60 } }],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 15 — Gauntlet. Combines a hazard weave, a shadow-crossing dodge, and
// a multi-plate AND-gate in one longer room — the "everything so far" room,
// now the true penultimate challenge.
const room15: RoomDef = {
  id: "gauntlet",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p15a", rect: { x: 140, y: 205, w: 90, h: 100 } },
    { id: "p15b", rect: { x: 300, y: 205, w: 220, h: 100 } },
  ],
  gates: [
    {
      id: "g15",
      rect: { x: 450, y: CORRIDOR_TOP, w: 40, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["p15a", "p15b"],
    },
  ],
  hazards: [
    { rect: { x: 560, y: CORRIDOR_TOP, w: 30, h: 70 } },
    { rect: { x: 680, y: 250, w: 30, h: 70 } },
  ],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
};

// Room 16 — The last door. The hardest combination: a multi-plate AND-gate,
// a hazard weave, and a shadow-crossing dodge, at the largest scale of the
// game. Ends the game on completion.
const room16: RoomDef = {
  id: "the-last-door",
  bounds: FULL_BOUNDS,
  walls: corridorWalls,
  plates: [
    { id: "p16a", rect: { x: 100, y: 205, w: 60, h: 100 } },
    { id: "p16b", rect: { x: 600, y: 205, w: 80, h: 100 } },
    { id: "p16c", rect: { x: 700, y: 205, w: 150, h: 100 } },
  ],
  gates: [
    { id: "g16a", rect: { x: 260, y: CORRIDOR_TOP, w: 20, h: CORRIDOR_BOTTOM - CORRIDOR_TOP }, requiredPlateIds: ["p16a"] },
    {
      id: "g16b",
      rect: { x: 800, y: CORRIDOR_TOP, w: 30, h: CORRIDOR_BOTTOM - CORRIDOR_TOP },
      requiredPlateIds: ["p16b", "p16c"],
    },
  ],
  hazards: [
    { rect: { x: 340, y: 225, w: 40, h: 60 } },
    { rect: { x: 440, y: 225, w: 40, h: 60 } },
  ],
  spawn: { x: 60, y: 250 },
  exit: { x: 850, y: 190, w: 40, h: 120 },
  isFinal: true,
};

export const rooms: RoomDef[] = [
  room1,
  room2,
  room3,
  room4,
  room5,
  room6,
  room7,
  room8,
  room9,
  room10,
  room11,
  room12,
  room13,
  room14,
  room15,
  room16,
];

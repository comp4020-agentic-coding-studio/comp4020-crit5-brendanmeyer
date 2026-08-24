import { CANVAS_HEIGHT, CANVAS_WIDTH, PLAYER_RADIUS, RESET_FLASH_MS, ROOM_TRANSITION_MS } from "../game/constants";
import type { GameState, RoomDef } from "../game/types";

const COLORS = {
  background: "#0a0e1a",
  wall: "#1b2338",
  wallEdge: "#2c3a5c",
  plateOff: "#2a3350",
  plateOn: "#7ee7ff",
  cableOff: "#232b45",
  cableOn: "#7ee7ff",
  gate: "#4a5578",
  gateEdge: "#6a7aa8",
  hazard: "#3a1420",
  hazardStripe: "#ff4d6d",
  player: "#f4f8ff",
  playerGlow: "#8fd8ff",
  shadow: "#5b3a8f",
  exit: "#ffe08a",
};

const gateOpenAmount = new Map<string, number>();

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawWalls(ctx: CanvasRenderingContext2D, room: RoomDef) {
  ctx.fillStyle = COLORS.wall;
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 2;
  for (const wall of room.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
  }
}

function drawHazards(ctx: CanvasRenderingContext2D, room: RoomDef, timeMs: number) {
  for (const hazard of room.hazards) {
    const { x, y, w, h } = hazard.rect;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.fillStyle = COLORS.hazard;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = COLORS.hazardStripe;
    ctx.lineWidth = 6;
    const offset = (timeMs / 200) % 24;
    for (let d = -h; d < w + h; d += 16) {
      ctx.beginPath();
      ctx.moveTo(x + d + offset, y);
      ctx.lineTo(x + d + offset - h, y + h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = COLORS.hazardStripe;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(timeMs / 180);
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }
}

function drawCables(ctx: CanvasRenderingContext2D, room: RoomDef, state: GameState) {
  for (const gate of room.gates) {
    for (const plateId of gate.requiredPlateIds) {
      const plate = room.plates.find((p) => p.id === plateId);
      if (!plate) continue;
      const active = state.plateActive[plateId];
      const px = plate.rect.x + plate.rect.w / 2;
      const py = plate.rect.y + plate.rect.h / 2;
      const gx = gate.rect.x + gate.rect.w / 2;
      const gy = gate.rect.y + gate.rect.h / 2;
      ctx.strokeStyle = active ? COLORS.cableOn : COLORS.cableOff;
      ctx.lineWidth = active ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(gx, gy);
      ctx.stroke();
    }
  }
}

function drawPlates(ctx: CanvasRenderingContext2D, room: RoomDef, state: GameState, timeMs: number) {
  for (const plate of room.plates) {
    const { x, y, w, h } = plate.rect;
    const active = state.plateActive[plate.id];
    const pulse = active ? 0.85 + 0.15 * Math.sin(timeMs / 140) : 1;
    ctx.fillStyle = active ? COLORS.plateOn : COLORS.plateOff;
    ctx.globalAlpha = active ? pulse : 0.9;
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (active) {
      ctx.strokeStyle = COLORS.plateOn;
      ctx.lineWidth = 2;
      roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 10);
      ctx.stroke();
    }
  }
}

function drawGates(ctx: CanvasRenderingContext2D, room: RoomDef, state: GameState, dtMs: number) {
  for (const gate of room.gates) {
    const target = state.gateOpen[gate.id] ? 1 : 0;
    const current = gateOpenAmount.get(gate.id) ?? 0;
    const speed = 1 / 220; // ~220ms to fully retract/close
    const next = current + Math.sign(target - current) * Math.min(Math.abs(target - current), speed * dtMs);
    gateOpenAmount.set(gate.id, next);

    if (next >= 0.98) continue; // fully open: nothing to draw

    const { x, y, w, h } = gate.rect;
    const vertical = h >= w; // corridor gates are tall and thin — retract upward
    ctx.fillStyle = COLORS.gate;
    ctx.strokeStyle = COLORS.gateEdge;
    ctx.lineWidth = 2;
    if (vertical) {
      const drawH = h * (1 - next);
      ctx.fillRect(x, y, w, drawH);
      ctx.strokeRect(x, y, w, drawH);
    } else {
      const drawW = w * (1 - next);
      ctx.fillRect(x, y, drawW, h);
      ctx.strokeRect(x, y, drawW, h);
    }
  }
}

function drawExit(ctx: CanvasRenderingContext2D, room: RoomDef, timeMs: number, isFirstRoom: boolean, player: { x: number; y: number }) {
  const { x, y, w, h } = room.exit;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pulse = 0.6 + 0.4 * Math.sin(timeMs / 260);

  if (isFirstRoom) {
    // A drift of light from the player toward the exit — the only nudge
    // room 1 gets, since it has no walls or objects to teach the mechanic.
    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const t = ((timeMs / 1400 + i / particleCount) % 1);
      const px = lerp(player.x, cx, t);
      const py = lerp(player.y, cy, t);
      ctx.globalAlpha = 0.5 * (1 - t);
      ctx.fillStyle = COLORS.exit;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const gradient = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(w, h) * 0.9 * pulse);
  gradient.addColorStop(0, "rgba(255, 224, 138, 0.9)");
  gradient.addColorStop(1, "rgba(255, 224, 138, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x - 30, y - 30, w + 60, h + 60);

  ctx.fillStyle = COLORS.exit;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  color: string,
  glowColor: string | null,
  alpha: number,
) {
  ctx.globalAlpha = alpha;
  if (glowColor) {
    const gradient = ctx.createRadialGradient(pos.x, pos.y, PLAYER_RADIUS * 0.4, pos.x, pos.y, PLAYER_RADIUS * 2.4);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, PLAYER_RADIUS * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, room: RoomDef, timeMs: number, dtMs: number) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawExit(ctx, room, timeMs, state.roomIndex === 0, state.player);
  drawCables(ctx, room, state);
  drawWalls(ctx, room);
  drawPlates(ctx, room, state, timeMs);
  drawGates(ctx, room, state, dtMs);
  drawHazards(ctx, room, timeMs);

  if (state.shadowAlive && state.phase !== "gameComplete") {
    drawCharacter(ctx, state.shadow, COLORS.shadow, "rgba(91,58,143,0.35)", 0.85);
  }

  if (state.phase !== "gameComplete") {
    const idlePulse = 1 + 0.03 * Math.sin(timeMs / 220);
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.scale(idlePulse, idlePulse);
    ctx.translate(-state.player.x, -state.player.y);
    drawCharacter(ctx, state.player, COLORS.player, "rgba(143,216,255,0.45)", 1);
    ctx.restore();
  }

  if (state.phase === "resetting") {
    const t = state.transitionRemainingMs / RESET_FLASH_MS;
    ctx.globalAlpha = 0.55 * t;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }

  if (state.phase === "roomComplete") {
    const t = 1 - state.transitionRemainingMs / ROOM_TRANSITION_MS;
    const radius = Math.hypot(CANVAS_WIDTH, CANVAS_HEIGHT) * t;
    const gradient = ctx.createRadialGradient(state.player.x, state.player.y, 0, state.player.x, state.player.y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state.phase === "gameComplete") {
    drawEnding(ctx, state, timeMs);
  }
}

let endingStartMs: number | null = null;

function drawEnding(ctx: CanvasRenderingContext2D, state: GameState, timeMs: number) {
  if (endingStartMs === null) endingStartMs = timeMs;
  const elapsed = timeMs - endingStartMs;
  const t = Math.min(1, elapsed / 1800);

  const brightness = t;
  ctx.fillStyle = `rgba(255, 244, 214, ${brightness})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const mergedX = lerp(state.player.x, CANVAS_WIDTH / 2, t);
  const mergedY = lerp(state.player.y, CANVAS_HEIGHT / 2, t);
  const glowRadius = lerp(PLAYER_RADIUS * 2, Math.hypot(CANVAS_WIDTH, CANVAS_HEIGHT), t * t);
  const gradient = ctx.createRadialGradient(mergedX, mergedY, 0, mergedX, mergedY, glowRadius);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,244,214,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}


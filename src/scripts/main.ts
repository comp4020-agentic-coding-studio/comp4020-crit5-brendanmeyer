import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../game/constants";
import { createInitialState, resolveStartRoomIndex, stepGame } from "../game/engine";
import { rooms } from "../game/rooms";
import type { InputVector } from "../game/types";
import { render } from "./renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("missing #game canvas");

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d canvas context unavailable");

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
  canvas!.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas!.style.height = `${CANVAS_HEIGHT * scale}px`;
}
fitCanvas();
window.addEventListener("resize", fitCanvas);

const held = new Set<string>();

const UP_KEYS = ["arrowup", "w"];
const DOWN_KEYS = ["arrowdown", "s"];
const LEFT_KEYS = ["arrowleft", "a"];
const RIGHT_KEYS = ["arrowright", "d"];

window.addEventListener("keydown", (event) => {
  held.add(event.key.toLowerCase());
});
window.addEventListener("keyup", (event) => {
  held.delete(event.key.toLowerCase());
});
window.addEventListener("blur", () => held.clear());

function currentInput(): InputVector {
  let x = 0;
  let y = 0;
  if (LEFT_KEYS.some((k) => held.has(k))) x -= 1;
  if (RIGHT_KEYS.some((k) => held.has(k))) x += 1;
  if (UP_KEYS.some((k) => held.has(k))) y -= 1;
  if (DOWN_KEYS.some((k) => held.has(k))) y += 1;
  return { x, y };
}

const startRoomIndex = resolveStartRoomIndex(new URLSearchParams(window.location.search).get("room"), rooms.length);
let state = createInitialState(rooms, startRoomIndex);
let lastTime: number | null = null;
const MAX_DT_MS = 50;

function frame(timeMs: number) {
  if (lastTime === null) lastTime = timeMs;
  const dt = Math.min(timeMs - lastTime, MAX_DT_MS);
  lastTime = timeMs;

  state = stepGame(state, rooms, currentInput(), dt);
  render(ctx!, state, rooms[state.roomIndex], timeMs, dt);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

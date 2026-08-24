export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlateDef {
  id: string;
  rect: Rect;
}

export interface GateDef {
  id: string;
  rect: Rect;
  requiredPlateIds: string[];
}

export interface HazardDef {
  rect: Rect;
}

export interface RoomDef {
  id: string;
  bounds: Rect;
  walls: Rect[];
  plates: PlateDef[];
  gates: GateDef[];
  hazards: HazardDef[];
  spawn: Vec2;
  exit: Rect;
  isFinal?: boolean;
}

export type GamePhase = "playing" | "resetting" | "roomComplete" | "gameComplete";

export interface HistorySample {
  t: number;
  pos: Vec2;
}

export interface InputVector {
  x: number;
  y: number;
}

export interface GameState {
  roomIndex: number;
  phase: GamePhase;
  player: Vec2;
  shadow: Vec2;
  shadowAlive: boolean;
  history: HistorySample[];
  elapsedMs: number;
  plateActive: Record<string, boolean>;
  gateOpen: Record<string, boolean>;
  transitionRemainingMs: number;
}

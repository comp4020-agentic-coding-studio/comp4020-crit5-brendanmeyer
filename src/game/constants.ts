export const SHADOW_DELAY_MS = 2000;
export const PLAYER_SPEED = 160; // units per second
export const PLAYER_RADIUS = 13;
export const RESET_FLASH_MS = 350;
export const ROOM_TRANSITION_MS = 550;

// History is trimmed once samples are older than this, so the buffer stays
// bounded regardless of how long a room is played.
export const HISTORY_RETENTION_MS = SHADOW_DELAY_MS + 200;

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 500;

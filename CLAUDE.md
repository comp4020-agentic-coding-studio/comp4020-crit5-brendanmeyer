# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

# Shadow Copy — Project Instructions

## Project goal

Build a small static browser puzzle game designed to be completed by a first-time player in approximately five minutes.

The defining constraint is that the game must teach itself entirely through play.

## Core mechanic

The player moves using WASD or arrow keys.

A shadow replays the player's movements approximately two seconds later.

The player uses their delayed shadow to activate pressure plates, open gates, and solve spatial/timing puzzles.

Later puzzles also require avoiding collision with the shadow.

## Non-negotiable design constraints

- No tutorial screen.
- No how-to-play modal.
- No gameplay instructions.
- No explanatory text used to teach mechanics.
- Do not use the README as a substitute for an in-game tutorial.
- The opening screen must make the player's first action obvious through visual affordance.
- Mechanics should be introduced through level design and feedback.
- The game must have a clear failure state and clear ending.
- Target total playtime: approximately five minutes.
- Prefer depth from the core mechanic over adding more mechanics.

## Game rules

- Player movement is responsive and immediate.
- Shadow reproduces the player's earlier movement after a fixed delay.
- Player or shadow can activate pressure plates.
- Pressure plates can control gates.
- Player-shadow collision resets the room.
- Hazard collision resets the room.
- Entering an open exit completes the room.
- Completing the final room ends the game.

## Technical constraints

- Fully client-side.
- Must work on GitHub Pages.
- No backend.
- No database.
- No required external API.
- Prefer plain HTML/CSS/JavaScript unless an existing project stack suggests otherwise.
- Keep game logic separate from rendering where practical.
- Avoid unnecessary dependencies.

## Testing

At least one core game rule must have a focused automated test.

Good candidates:

- delayed shadow position
- collision causes reset
- pressure plate opens gate

Tests should target deterministic game logic rather than visual rendering.

## Design priorities

When choosing between alternatives, prioritize:

1. Learnability without words
2. Fairness
3. Responsive controls
4. Clear visual feedback
5. Interesting consequences of the shadow mechanic
6. Small, polished scope

Do not add features merely to make the project appear more complex.

# Crit 5 reflection

**What was the breakthrough that moved the work forward?**

The obvious way to build anything with Claude, in this case a game, is to prompt Claude, react, then prompt the next set of instructions. Instead, this time before any code existed, I wrote the whole design into `CLAUDE.md`, including the core mechanic, the constraints (eg: no tutorial text anywhere, mechanics taught through level design, a clear fail state and ending), and the difficulty progression across all of the rooms. I knew it had paid off when the entire game, engine, all the rooms matched the intended progression, and a test suite covering the delayed shadow, collisions and buttons/gates/hazzards all were developed in one session without me having to specify those decisions individually as they came up. It still didn't do everything 100%, but it completed the majority.

**What did this work change about who I want to be as a software developer?**

Honestly, not much this time, but that's kind of the point. Looking back at crit 1, I was pretty unsure about AI tools taking the puzzle out of coding. By crit 2 and assignment 1 I'd come around to using Claude for the repetitive, menial parts while still wanting to design things myself, as long as I kept checking its work rather than trusting a green check on its own. This project didn't move that needle, it just confirmed it again: writing the brief up front let Claude work far more intentionally with a lot less hand-holding than earlier deliverables, but I still found two levels where the tests passed and the game still didn't work the way it was supposed to. So if anything, this deliverable made me more comfortable leaning on AI more in how I build software going forward, not less.

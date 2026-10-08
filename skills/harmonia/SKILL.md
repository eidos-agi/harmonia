---
name: harmonia
description: Drive Eidos Harmonia, the Mac DAW, through bin/harmonia and the MCP server. Use when a session, scene, clip, track, or mix change is requested.
---

# Harmonia

Call `scripts/harmonia` or the MCP tools from `node mcp/server.mjs`. Both read `api/commands.json`.

A command with `engine: "missing"` exits 77. That means scene launch, clip slots, session record, locators, returns, or master gain are not in the engine yet. Do not route around the refusal with the window, and do not report the action as done.

Build on Mac with `./scripts/build.sh release` before expecting `engine: "ready"` commands to reach a running DAW. The published Stratawright 1.0.0 app does not load audio.

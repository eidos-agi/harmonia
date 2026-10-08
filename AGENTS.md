# Harmonia

Mac only. Do not add a Windows ship path.

The product is the API. `api/commands.json` is the list of actions. `scripts/harmonia` and `mcp/server.mjs` both read that file. A new action lands in all three in the same change. A GUI control with no command is a bug.

`engine: "ready"` means `daw-cli` already does it. `engine: "missing"` means the Live-shaped action is part of the product and the engine does not do it yet. Those commands exit `77 NOT_IN_ENGINE`. Do not stub them as success.

Do not time-stretch a clip onto the grid unless the command the caller used says so.

Upstream is `https://github.com/Goldwaterfung/Stratawright.git`. Do not rewrite that history.

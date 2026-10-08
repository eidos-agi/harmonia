# Eidos Harmonia

The work list is [VISION.md](VISION.md). An agent keeps going until the proofs in that file are closed.

Harmonia is a Mac DAW. A set has tracks, clip slots, scenes, and an arrangement, in the shape of a Live set. Every change is a CLI command and an MCP tool. The window is a view of that same API. A control that exists only in the window is a bug.

Harmonia is open source under the MIT license. The `upstream` remote is [Stratawright](https://github.com/Goldwaterfung/Stratawright). Copyright stays with the Stratawright authors. See [LICENSE](LICENSE).

The engine today is a timeline: tracks, arrangement clips, plugins, routing, analysis, and export. Those commands call `daw-cli`. Scene launch, clip slots, session record, locators, return tracks, and the master gain are in [api/commands.json](api/commands.json). The CLI and MCP both refuse them with `77 NOT_IN_ENGINE`. They do not pretend to succeed.

## Use

Build on this Mac:

```bash
./scripts/build.sh release
scripts/harmonia status
```

The MCP server speaks stdio:

```bash
node mcp/server.mjs
```

`scripts/harmonia commands` prints the whole table. `HARMONIA_DAW_CLI` points at a `daw-cli` binary when it is not `build/release/bin/daw-cli`.

The working set is [projects/leave-the-light/leave-the-light.json](projects/leave-the-light/leave-the-light.json). The recordings are not in this repository. See [projects/leave-the-light/README.md](projects/leave-the-light/README.md).

The Stratawright 1.0.0 Mac package does not load audio. Its clip list is a fixed clip named Drums_Wav. Use a build from this repo.

## Rules

Mac is the only Harmonia target. Add a command to `api/commands.json` in the same change as the CLI and the MCP. Do not mark a session action done while its `engine` field is `missing`.

The upstream readme, including its build notes, is [docs/stratawright-readme.md](docs/stratawright-readme.md).

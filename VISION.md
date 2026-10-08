# Eidos Harmonia

This file is the job. An agent that opens this repo keeps going until every proof below is closed. There is no session end and no date. Calendar estimates are not a stop.

Harmonia is a Mac DAW. A set works the way a Live set works: tracks, clip slots, scenes, devices, and an arrangement. Every change to a set is a CLI command and an MCP tool. The window is a view of that API. A change that exists only in the window is a bug.

The engine started as [Stratawright](https://github.com/Goldwaterfung/Stratawright) (MIT). Upstream stays on the `upstream` remote. Do not rewrite that history. This repo is `eidos-agi/harmonia`.

## How an agent continues

1. Read the laws, then the queue.
2. Take the first open proof whose dependencies are closed.
3. Make that proof true in the engine, in `api/commands.json`, in `scripts/harmonia`, and in `mcp/server.mjs` together.
4. Run the proof. Paste the command and the result under that item, with the date.
5. Commit. Push when the proof is closed.
6. Start again at step 2.

Skip a proof that is already closed. Do not redesign a closed proof unless a later proof shows it is false. Do not mark a proof closed because a handler returns success. The listed check has to pass.

If a proof is blocked, write the blocker under the item and take the next proof that is not blocked. Do not sit on a plan.

`engine: "missing"` in `api/commands.json` means the command is part of this vision and the engine does not do it yet. Those commands exit `77 NOT_IN_ENGINE`. Shipping a success string for them is a failed proof.

## Laws

1. Mac is the only ship target. Windows files inherited from upstream can stay. Do not add a Windows release path.
2. `api/commands.json` is the list of set changes. The CLI and the MCP read that file. A new set change lands in the JSON, the CLI, and the MCP in the same change.
3. The window calls the same functions the CLI calls. It does not keep a private way to mutate a set.
4. Do not time-stretch audio unless the caller used a command that says so. Playback ratio stays 1 and warp stays bypass until a warp command asks for something else.
5. Do not invent a tempo, a key, or a title for source audio. Leave the Light stays Leave the Light.
6. Track identity survives insert and delete. Indexes that shift are not identity.
7. An agent can run the engine without a person sitting at the window. Headless is a proof, not a wish.
8. The Stratawright 1.0.0 Mac package is not Harmonia. Its clip list is a fixed clip named Drums_Wav. Do not point `HARMONIA_DAW_CLI` at `~/Applications/strata_studio.app`.
9. Commands refuse with a real error when they cannot do the thing. Silence and fake JSON are failures.
10. Analysis commands that already exist stay. They are extra. They do not count as the session.

The word scene in `IArrangementManagerController` means a second arrangement. It is not a Live scene. Do not wire `scene fire` to arrangement switching.

## The set

A set is one document.

- Song: tempo, time signature, loop, record, locators, sample rate.
- Tracks: audio, MIDI, return, group, and one master. Each track has gain, pan, mute, solo, arm, monitor, input, output, sends, devices, and meters.
- Session: a grid. Columns are tracks. Rows are scenes. A cell is a clip slot. A slot is empty or holds one clip.
- Scenes: a row has a name, a color, and may have its own tempo and time signature. Firing a scene launches the slots in that row.
- Arrangement: the same clips can also live on a timeline, with locators and a loop.
- Clip: audio or MIDI. Audio has a file, start, end, loop, fades, transpose, warp, and warp markers. MIDI has notes. Both have launch mode, follow action, gain, name, and color.
- Devices: a chain on a track. A device has parameters an agent can list and set. Racks have chains and macros.
- Transport: play, stop, seek, record, metronome, count-in.
- History: undo and redo.

View state (which panel is open, zoom, the draw tool) is not a set change. Leave it off the command table.

## Truth on 2026-10-08

Local tree: `~/repos-eidos-agi/harmonia`. Remote: `eidos-agi/harmonia`, public. About 115,000 lines of C++ in 610 files. The agent layer is about 3,700 of those lines.

`api/commands.json` has 54 commands with `engine: "ready"` and 14 with `engine: "missing"`. The ready commands call `daw-cli`. None of them have been run on a Harmonia build. There is no Harmonia build on this Mac. `./scripts/build.sh release` was not finished. The upstream dependency script would have upgraded Git, Rust, and pyenv and installed all of Qt.

The 14 refused commands are `scene list`, `scene create`, `scene fire`, `scene stop`, `clip-slot list`, `clip-slot add-audio`, `clip-slot launch`, `clip-slot stop`, `song loop`, `song record`, `return create`, `master set-gain`, `locator add`, `locator jump`. Each exits 77.

Dogfood set: `projects/leave-the-light/leave-the-light.json`.

Format `AGDAW_JSON_V6`. The set name is Leave the Light. Project rate is 44.1 kHz. Tempo 120 and 4/4 are the engine defaults, not a measured tempo of the song. There is no key. Both clips use warp bypass and playback ratio 1. `loadFromJsonFile` resolves `relativeFilePath` beside the JSON. The set name is not a path.

Audio is local and gitignored under `projects/*/audio/`. It is not in the public repo.

- `projects/leave-the-light/audio/leave-the-light.wav` — 44.1 kHz, stereo, 16-bit, 6,412,184 frames, 145.401 seconds. Leave the Light, from Summer 1984 part-04.
- `projects/leave-the-light/audio/leave-the-light-super-extended.wav` — 48 kHz, stereo, 16-bit, 15,858,414 frames, 330.384 seconds. Leave the Light (Super Extended). On the 44.1 kHz timeline its length is 14,569,918 samples, which keeps that duration. It is not time-stretched.

The codec reader in this tree reads wav and flac through libsndfile.

## Queue

Take these in order. Each proof stays open until the check has been run and the output is written here.

### 1. A Mac build that loads the dogfood wav

Proof, open.

Build `./scripts/build.sh release` without upgrading unrelated Homebrew packages. Start that build. Open `projects/leave-the-light/leave-the-light.json`, or `scripts/harmonia clip add-audio` places `projects/leave-the-light/audio/leave-the-light.wav` on track 1 at bar 1. `scripts/harmonia clip list --track 1` shows a duration of 145.401 seconds, within 50 ms. Export the master and confirm the body of the export matches the wav. The Stratawright 1.0.0 app does not count.

Depends on nothing.

### 2. The wired commands are true or demoted

Proof, open.

Run every `engine: "ready"` command against the build from queue 1. A command that does not do what its `live` string says moves to `engine: "missing"` in the same commit, with the failure pasted here. Leave it ready only when the check passed.

Depends on 1.

### 3. Set file, history, and the mutations the window already has

Proof, open.

These exist as shortcuts or controllers and have no command. Each gets a command, a CLI line, an MCP tool, and a test:

- New set, open, save, save as. Round-trip `projects/leave-the-light/leave-the-light.json`: open, save, quit, open. Clip list still shows 145.401 seconds on Leave the Light and 330.384 seconds on Leave the Light (Super Extended). Warp stays bypass.
- Undo and redo one track create.
- Metronome on and off. Count-in on and off.
- Arm a track. Clear every solo.
- Copy, cut, and paste one arrangement clip.
- Add a MIDI note, list notes, move one, remove one. `midi add-note` is wired. List, move, and remove are not.
- Add an automation point, move it, delete it, and record automation onto a lane.
- Start and stop an audio recording onto an armed track.
- Switch, create, rename, clone, and delete an alternate arrangement, under a name that is not `scene`.

Depends on 2.

### 4. Session grid

Proof, open.

`scene create`, `clip-slot add-audio`, and `scene fire` exit 0. Firing scene 1 launches the Leave the Light slot. A master export of the two seconds after the launch contains that wav from its start, unstretched. `clip-slot stop` and `scene stop` end it. `clip-slot list` shows empty and filled slots.

Launch quantization, launch modes (trigger, gate, toggle, repeat), legato, follow action, follow-action chance, stop-all, and back-to-arrangement are commands too. A follow action of "next" on a one-bar clip advances to the next scene without a second call.

Depends on 3.

### 5. Headless, events, stable ids

Proof, open.

`scripts/harmonia` runs the engine with no window open and completes queue 4's launch proof. The process emits events for transport start, transport stop, scene fired, and clip slot launched. Deleting track 1 does not change the id of track 2. An agent can undo the delete.

Depends on 4.

### 6. Clip body

Proof, open.

Commands for warp on, warp off, warp mode, warp markers, clip start, clip end, clip loop, fade in, fade out, reverse, transpose, clip name, and clip color. Default remains warp bypass and playback ratio 1. A transpose command of zero cents matches the source. A named warp mode is the only path that changes duration or pitch.

Depends on 5.

### 7. Mixer

Proof, open.

Commands for return create, master gain, cue, solo-in-place, crossfader assign, input routing, output routing, monitor mode, freeze, flatten, duplicate track, reorder track, and activate track. `route send` stays. An agent can read peak and RMS meters for a playing track. Master gain of the dogfood export is measurable.

Depends on 5. Can proceed beside 6.

### 8. Record into the session

Proof, open.

Arm a track, set input, count in, and `song record` writes a new clip into the armed slot. Arrangement record writes onto the timeline. Overdub on a MIDI clip keeps the old notes and adds new ones. Takes can be listed and comped into one clip.

Depends on 4 and 7.

### 9. Time, library, and files

Proof, open.

Seek, continue, punch in, punch out, tap tempo. Tempo and time-signature changes along the arrangement. Insert time, delete time, duplicate time, consolidate. Locators from the refused list, plus jump. Groove pool: assign, commit. Browser: search, preview, load from a folder the agent names. Collect files into the set folder. Export MIDI. Export a time range. Resample a track to a new audio clip. Set the set sample rate and the audio device.

Depends on 6 and 7.

### 10. Devices an agent can build a track with

Proof, open.

Plugin scan, add, set param, copy, and copy chain stay, and they gain remove, bypass, reorder, list parameters, read one parameter, and load and save a preset. Instrument, MIDI effect, and audio effect are separate chains.

Built-in devices, each with listable parameters and a command test, no AU stand-in counted as the device:

- Sampler that plays the dogfood wav from a MIDI note
- Drum instrument with pads
- EQ
- Compressor
- Instrument rack, audio rack, and MIDI rack, each with chains and macros

Depends on 2. The built-in devices depend on 5 so they can be tested headless.

### 11. Signed Mac app

Proof, open.

A signed, notarized Harmonia app on this Mac. `harmonia` on the path is the CLI from that app. The MCP server is the same binary's stdio mode, or a script shipped beside it. Opening the app and running queue 4's launch proof through the installed CLI both work.

Depends on 4 and 5.

### 12. After the set is real

These are part of the vision and they wait until queue 11 is closed.

- Link, so two Macs share transport.
- A control surface in the shape of Push: pads fire clip slots through the same commands, and the CLI can dump the surface state.
- A device API a third party can compile, so a device is not stuck as a built-in.

Proof, open. Write the checks when queue 11 closes. Do not start them early.

## Surface checklist

Status words: `wired` means the command exists and is unproven. `refused` means exit 77. `window` means the GUI or a controller can do it and the command table cannot. `absent` means it is not in the tree. Change the word only when the queue proof closes.

### Transport

| Action | Now |
|---|---|
| Play, stop | wired |
| Tempo, time signature | wired |
| Status (position, tempo, signature, transport) | wired |
| Seek, continue | absent |
| Record, overdub, punch, count-in | window for record and count-in, no command |
| Metronome, tap tempo | window for metronome, no command |
| Loop brace | refused as `song loop` |
| Back to arrangement | absent |

### Session

| Action | Now |
|---|---|
| Scene list, create, fire, stop | refused |
| Scene name, color, tempo, time signature | absent |
| Clip slot list, add audio, launch, stop | refused |
| Launch quantization and launch modes | absent |
| Legato, follow action, follow-action chance | absent |
| Stop all clips | absent |
| Session record into the armed slot | refused as `song record` |

### Arrangement

| Action | Now |
|---|---|
| Add audio clip, add MIDI clip, list, gain, mute, split, trim, quantize, merge, move, nudge | wired |
| Locators | refused |
| Insert, delete, duplicate time, consolidate | absent |
| Copy, cut, paste | window |
| Slip | window |
| Alternate arrangements | window, and they are not scenes |

### Tracks and mixer

| Action | Now |
|---|---|
| Create, create batch, list, inspect, gain, pan, mute, solo, color, delete, sanitize names, auto color | wired |
| Folder route, send, sidechain, route list | wired |
| Arm, monitor, input, output | window for arm only |
| Return, master gain | refused |
| Cue, solo-in-place, crossfader | absent |
| Meters | window |
| Freeze, flatten, duplicate, reorder, activate | absent |
| Gain stage toward a target RMS | wired |

### Clips

| Action | Now |
|---|---|
| File on the arrangement | wired |
| Warp, warp markers, clip loop, fades, reverse, transpose, name, color | absent, and import forces warp bypass |
| MIDI note add | wired |
| MIDI note list, move, remove, velocity, probability, mute | window for move and remove |
| Clip envelopes | absent |

### Devices

| Action | Now |
|---|---|
| Scan, list, add, set param, copy, copy chain | wired |
| Remove, bypass, reorder, list params, read param, preset | absent |
| Separate instrument and effect chains | absent |
| Racks and macros | absent |
| Sampler, drums, EQ, compressor as built-ins | absent |
| AU, VST3, CLAP host | wired, unproven |

### Automation, files, library

| Action | Now |
|---|---|
| Automation points and automation record | window |
| Undo, redo | window |
| New, open, save, save as | window |
| Browser search, preview, load | absent |
| Collect files, export MIDI, export a range, resample | absent |
| Master export and stem export, job list, status, cancel | wired |
| Groove pool | absent |
| Set sample rate and audio device | absent |
| Analysis (spectrum, loudness, true peak, masking, phase, stereo width, resonance, window) | wired, and not a substitute for meters |

## Dogfood session

The first set that must work, end to end, after queue 4:

1. Open `projects/leave-the-light/leave-the-light.json`. 44.1 kHz. Tempo stays the engine default.
2. Track 1 is Leave the Light. The clip is the 145.401 second wav, warp off, playback ratio 1.
3. Track 2 is Leave the Light (Super Extended). Same warp settings. Its duration stays 330.384 seconds.
4. Scene 1, slot 1, the Leave the Light wav.
5. Fire scene 1.
6. Export two seconds.
7. The export matches the start of that wav.
8. Save, quit, open, fire again.

That session is the acceptance test for the product. Later queues add to it. They do not replace it.

## What a closed Harmonia is

A person, or an agent, on this Mac can do every row in the checklist through `scripts/harmonia` or the MCP server. The window shows the same set and cannot do something the command cannot do. Leave the Light launches from a clip slot, unstretched, with no one touching the mouse. The app is signed. Queue 12 is the only list still open.

import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { assertTable, commands, invoke, toolList, toolName } from "../mcp/lib.mjs"

test("the command table is the Live API and the engine verbs", () => {
  assertTable()
  const missing = commands.filter((cmd) => cmd.engine === "missing").map((cmd) => cmd.id)
  for (const id of ["scene.fire", "clip-slot.launch", "song.record", "locator.jump", "master.set-gain"]) {
    assert.ok(missing.includes(id), id)
  }
  assert.ok(commands.some((cmd) => cmd.id === "clip.add-audio" && cmd.engine === "ready"))
  const names = new Set(toolList().map((tool) => tool.name))
  assert.equal(names.size, commands.length)
  assert.ok(names.has(toolName("scene.fire")))
})

test("a missing Live action refuses and does not call daw-cli", () => {
  const dir = mkdtempSync(join(tmpdir(), "harmonia-"))
  const bin = join(dir, "daw-cli")
  const log = join(dir, "called")
  writeFileSync(bin, `#!/bin/sh\necho called >> "${log}"\nexit 0\n`)
  chmodSync(bin, 0o755)
  process.env.HARMONIA_DAW_CLI = bin
  const result = invoke(["scene", "fire", "--scene", "1"])
  assert.equal(result.code, 77)
  assert.match(result.text, /NOT_IN_ENGINE/)
  assert.equal(spawnSync("test", ["-f", log]).status, 1)
})

test("a ready command is the same daw-cli argv", () => {
  const dir = mkdtempSync(join(tmpdir(), "harmonia-"))
  const bin = join(dir, "daw-cli")
  const log = join(dir, "called")
  writeFileSync(bin, `#!/bin/sh\nprintf '%s\\n' "$@" > "${log}"\nexit 0\n`)
  chmodSync(bin, 0o755)
  process.env.HARMONIA_DAW_CLI = bin
  const result = invoke(["transport", "set-tempo", "--bpm", "111"])
  assert.equal(result.code, 0)
  assert.equal(readFileSync(log, "utf8"), "transport\nset-tempo\n--bpm\n111\n")
})

test("the MCP server lists tools and refuses scene launch", async () => {
  const child = spawn(process.execPath, ["mcp/server.mjs"], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    stdio: ["pipe", "pipe", "pipe"],
  })
  const pending = new Map()
  let buf = Buffer.alloc(0)
  let nextId = 1
  child.stdout.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk])
    while (true) {
      const sep = buf.indexOf("\r\n\r\n")
      if (sep < 0) return
      const header = buf.slice(0, sep).toString("utf8")
      const match = header.match(/Content-Length:\s*(\d+)/i)
      if (!match) {
        buf = buf.slice(sep + 4)
        continue
      }
      const length = Number(match[1])
      const start = sep + 4
      if (buf.length < start + length) return
      const body = JSON.parse(buf.slice(start, start + length).toString("utf8"))
      buf = buf.slice(start + length)
      const waiter = pending.get(body.id)
      if (waiter) {
        pending.delete(body.id)
        waiter(body)
      }
    }
  })
  function call(method, params) {
    const id = nextId++
    const payload = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id, method, params }), "utf8")
    child.stdin.write(`Content-Length: ${payload.length}\r\n\r\n`)
    child.stdin.write(payload)
    return new Promise((resolve) => pending.set(id, resolve))
  }
  const init = await call("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } })
  assert.equal(init.result.serverInfo.name, "harmonia")
  const list = await call("tools/list", {})
  assert.ok(list.result.tools.some((tool) => tool.name === "harmonia_scene_fire"))
  const fired = await call("tools/call", { name: "harmonia_scene_fire", arguments: { scene: "1" } })
  assert.equal(fired.result.isError, true)
  assert.match(fired.result.content[0].text, /NOT_IN_ENGINE/)
  child.kill()
})

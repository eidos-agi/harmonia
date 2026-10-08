import { spawnSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const table = JSON.parse(readFileSync(join(root, "api/commands.json"), "utf8"))

export const commands = table.commands
export const NOT_IN_ENGINE = 77
export const INVALID_ARGS = 70
export const DAW_NOT_RUNNING = 71

const readyHeads = new Set(["status", "transport", "track", "plugin", "prep", "clip", "midi", "route", "analyze", "export", "job"])

export function toolName(id) {
  return "harmonia_" + id.replaceAll(".", "_").replaceAll("-", "_")
}

export function matchCommand(tokens) {
  let best = null
  for (const cmd of commands) {
    const n = cmd.cli.length
    if (tokens.length < n) continue
    const same = cmd.cli.every((part, i) => tokens[i] === part)
    if (same && (!best || n > best.cli.length)) best = cmd
  }
  return best
}

export function parseFlags(tokens) {
  const flags = {}
  const unknown = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token.startsWith("--")) {
      unknown.push(token)
      continue
    }
    const name = token.slice(2)
    const next = tokens[i + 1]
    if (next === undefined || next.startsWith("--")) flags[name] = true
    else flags[name] = tokens[++i]
  }
  return { flags, unknown }
}

export function dawCliPath() {
  if (process.env.HARMONIA_DAW_CLI) return process.env.HARMONIA_DAW_CLI
  const candidates = [
    join(root, "build/release/bin/daw-cli"),
    join(root, "build/release/src/Agentic layer/daw-cli"),
  ]
  return candidates.find((path) => existsSync(path)) || null
}

function missingText(cmd) {
  return `ERROR ${NOT_IN_ENGINE} NOT_IN_ENGINE "${cmd.live} The engine does not do this yet."`
}

export function invoke(tokens) {
  if (tokens.length === 1 && tokens[0] === "commands") {
    const lines = commands.map((cmd) => `${cmd.engine}\t${cmd.cli.join(" ")}\t${cmd.live}`)
    return { code: 0, text: lines.join("\n") + "\n" }
  }
  const cmd = matchCommand(tokens)
  if (!cmd) {
    return { code: INVALID_ARGS, text: 'ERROR 70 INVALID_ARGS "Unknown Harmonia command."\n' }
  }
  const { flags, unknown } = parseFlags(tokens.slice(cmd.cli.length))
  if (unknown.length) {
    return { code: INVALID_ARGS, text: `ERROR 70 INVALID_ARGS "Unexpected ${unknown.join(" ")}."\n` }
  }
  const known = new Set((cmd.args || []).map((arg) => arg.name))
  for (const name of Object.keys(flags)) {
    if (!known.has(name)) {
      return { code: INVALID_ARGS, text: `ERROR 70 INVALID_ARGS "Unknown flag --${name}."\n` }
    }
  }
  for (const arg of cmd.args || []) {
    if (arg.required && (flags[arg.name] === undefined || flags[arg.name] === true && arg.kind !== "flag")) {
      return { code: INVALID_ARGS, text: `ERROR 70 INVALID_ARGS "Missing --${arg.name}."\n` }
    }
  }
  if (cmd.engine === "missing") return { code: NOT_IN_ENGINE, text: missingText(cmd) + "\n" }
  if (!readyHeads.has(cmd.argv[0])) {
    return { code: NOT_IN_ENGINE, text: missingText(cmd) + "\n" }
  }
  const bin = dawCliPath()
  if (!bin) {
    return {
      code: DAW_NOT_RUNNING,
      text: 'ERROR 71 DAW_NOT_RUNNING "Harmonia is not built. Run ./scripts/build.sh release on this Mac."\n',
    }
  }
  const argv = [...cmd.argv]
  for (const arg of cmd.args || []) {
    if (flags[arg.name] === undefined) continue
    if (arg.kind === "flag") {
      if (flags[arg.name] === true || flags[arg.name] === "true") argv.push("--" + arg.name)
      continue
    }
    argv.push("--" + arg.name, String(flags[arg.name]))
  }
  const result = spawnSync(bin, argv, { encoding: "utf8" })
  if (result.error) {
    return { code: DAW_NOT_RUNNING, text: `ERROR 71 DAW_NOT_RUNNING "${result.error.message}"\n` }
  }
  return { code: result.status ?? 1, text: `${result.stdout || ""}${result.stderr || ""}` }
}

export function toolList() {
  return commands.map((cmd) => {
    const properties = {}
    const required = []
    for (const arg of cmd.args || []) {
      properties[arg.name] = {
        type: "string",
        description: arg.kind === "flag" ? "Pass true to set this flag." : arg.name,
      }
      if (arg.required) required.push(arg.name)
    }
    return {
      name: toolName(cmd.id),
      description: `${cmd.live} Engine: ${cmd.engine}.`,
      inputSchema: { type: "object", properties, required, additionalProperties: false },
    }
  })
}

export function invokeTool(name, args = {}) {
  const cmd = commands.find((item) => toolName(item.id) === name)
  if (!cmd) return { code: INVALID_ARGS, text: `ERROR 70 INVALID_ARGS "Unknown tool ${name}."\n` }
  const tokens = [...cmd.cli]
  for (const arg of cmd.args || []) {
    if (args[arg.name] === undefined || args[arg.name] === null || args[arg.name] === "") continue
    tokens.push("--" + arg.name)
    if (arg.kind !== "flag") tokens.push(String(args[arg.name]))
    else if (String(args[arg.name]) !== "true") tokens.push(String(args[arg.name]))
  }
  return invoke(tokens)
}

export function assertTable() {
  const ids = new Set()
  for (const cmd of commands) {
    if (ids.has(cmd.id)) throw new Error(`duplicate ${cmd.id}`)
    ids.add(cmd.id)
    if (cmd.engine === "ready") {
      if (!readyHeads.has(cmd.argv[0])) throw new Error(`${cmd.id} is not a daw-cli verb`)
    } else if (cmd.engine !== "missing") {
      throw new Error(`${cmd.id} has engine ${cmd.engine}`)
    }
  }
}

import { toolList, invokeTool } from "./lib.mjs"

function write(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8")
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`)
  process.stdout.write(body)
}

function reply(id, result) {
  write({ jsonrpc: "2.0", id, result })
}

function fail(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } })
}

function handle(message) {
  if (!message || message.jsonrpc !== "2.0") return
  const { id, method, params } = message
  if (id === undefined) return
  if (method === "initialize") {
    reply(id, {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "harmonia", version: "0.1.0" },
    })
    return
  }
  if (method === "tools/list") {
    reply(id, { tools: toolList() })
    return
  }
  if (method === "tools/call") {
    const name = params?.name
    const args = params?.arguments || {}
    const result = invokeTool(name, args)
    reply(id, {
      content: [{ type: "text", text: result.text }],
      isError: result.code !== 0,
    })
    return
  }
  if (method === "ping") {
    reply(id, {})
    return
  }
  fail(id, -32601, `Unknown method ${method}`)
}

let buffer = Buffer.alloc(0)
process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk])
  while (true) {
    const sep = buffer.indexOf("\r\n\r\n")
    if (sep < 0) return
    const header = buffer.slice(0, sep).toString("utf8")
    const match = header.match(/Content-Length:\s*(\d+)/i)
    if (!match) {
      buffer = buffer.slice(sep + 4)
      continue
    }
    const length = Number(match[1])
    const start = sep + 4
    if (buffer.length < start + length) return
    const body = buffer.slice(start, start + length).toString("utf8")
    buffer = buffer.slice(start + length)
    try {
      handle(JSON.parse(body))
    } catch (error) {
      write({ jsonrpc: "2.0", id: null, error: { code: -32700, message: String(error.message || error) } })
    }
  }
})

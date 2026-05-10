export type JsonObject = Record<string, unknown>

export type ConvertLog = {
  level: "success" | "info" | "warning" | "error"
  message: string
}

export function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getAny(source: unknown, names: string[], defaultValue: unknown = "") {
  if (!isObject(source)) return defaultValue

  for (const name of names) {
    const value = source[name]
    if (value !== undefined && value !== null && value !== "") return value
  }

  return defaultValue
}

export function toStringValue(value: unknown) {
  if (value === undefined || value === null) return ""
  return String(value)
}

export function toBool(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    return ["true", "1", "yes", "disabled"].includes(value.toLowerCase())
  }
  return Boolean(value)
}

export function safeFilename(value: unknown) {
  const normalized = String(value || "account")
    .replace(/[^a-zA-Z0-9_.@+-]+/g, "_")
    .slice(0, 120)
  return normalized || "account"
}

export function utcNowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function formatChinaTime(date: Date) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  return `${formatter.format(date).replace(" ", "T")}+08:00`
}

export function normalizeTime(value: unknown, fallbackMinutes = 30) {
  if (value === undefined || value === null || value === "") {
    return formatChinaTime(new Date(Date.now() + fallbackMinutes * 60_000))
  }

  if (typeof value === "number") {
    const seconds = value > 10_000_000_000 ? value / 1000 : value
    return formatChinaTime(new Date(seconds * 1000))
  }

  const raw = String(value).trim()

  if (/^\d+$/.test(raw)) {
    const timestamp = Number(raw)
    const seconds = timestamp > 10_000_000_000 ? timestamp / 1000 : timestamp
    return formatChinaTime(new Date(seconds * 1000))
  }

  const parsed = new Date(raw.replace("Z", "+00:00"))
  if (!Number.isNaN(parsed.getTime())) return formatChinaTime(parsed)

  return raw
}

export async function readJsonFile(file: File) {
  const text = await file.text()
  return JSON.parse(text) as unknown
}

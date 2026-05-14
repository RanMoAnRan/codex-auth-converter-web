import JSZip from "jszip"

import { getAny, isObject, readJsonFile, utcNowIso, type ConvertLog, type JsonObject } from "./common"
import type { Sub2ApiAccount } from "./cpa-to-sub2api"

type Sub2ApiSourceFile = {
  name: string
  data: unknown
}

export type MergeSub2ApiResult = {
  output: {
    exported_at: string
    proxies: unknown[]
    accounts: Sub2ApiAccount[]
  }
  logs: ConvertLog[]
  total: number
  sourceTotal: number
  success: number
  skipped: number
  duplicate: number
}

function parseAccounts(data: unknown): JsonObject[] {
  if (Array.isArray(data)) return data.filter(isObject)

  if (isObject(data)) {
    for (const key of ["accounts", "data", "items", "list", "records"]) {
      const value = data[key]
      if (Array.isArray(value)) return value.filter(isObject)
    }

    if ("credentials" in data || "access_token" in data || "refresh_token" in data) return [data]
  }

  throw new Error("无法识别 JSON：需要数组，或包含 accounts/data/items/list/records 的对象")
}

function normalizeAccount(account: JsonObject): Sub2ApiAccount | null {
  const credentials = isObject(account.credentials) ? account.credentials : account
  const accessToken = getAny(credentials, ["access_token", "accessToken", "access", "token"])
  const refreshToken = getAny(credentials, ["refresh_token", "refreshToken", "refresh"])

  if (!accessToken && !refreshToken) return null

  return {
    name: String(getAny(account, ["name"]) || getAny(credentials, ["email", "account", "username", "name"]) || "account"),
    platform: String(getAny(account, ["platform"], "openai")) === "openai" ? "openai" : "openai",
    type: String(getAny(account, ["type"], "oauth")) === "oauth" ? "oauth" : "oauth",
    credentials: { ...credentials },
    extra: isObject(account.extra) ? { ...account.extra } : {},
    concurrency: Number(getAny(account, ["concurrency"], 10)) || 10,
    priority: Number(getAny(account, ["priority"], 1)) || 1,
    rate_multiplier: Number(getAny(account, ["rate_multiplier", "rateMultiplier"], 1)) || 1,
    auto_pause_on_expired: getAny(account, ["auto_pause_on_expired", "autoPauseOnExpired"], true) !== false,
    ...(getAny(account, ["disabled", "disable", "is_disabled", "isDisabled"], undefined) !== undefined
      ? { disabled: Boolean(getAny(account, ["disabled", "disable", "is_disabled", "isDisabled"])) }
      : {}),
  }
}

function accountDedupKey(account: Sub2ApiAccount) {
  const credentials = account.credentials || {}
  const candidates = [
    getAny(credentials, ["email", "account", "username"]),
    getAny(credentials, ["chatgpt_user_id", "chatgpt_account_id", "account_id", "user_id", "userId", "id"]),
    getAny(credentials, ["refresh_token", "refreshToken", "refresh"]),
    getAny(credentials, ["access_token", "accessToken", "access", "token"]),
    account.name,
  ]

  const value = candidates.find((item) => item !== undefined && item !== null && item !== "")
  return value ? String(value).trim().toLowerCase() : ""
}

function mergeProxies(data: unknown, proxies: unknown[], seen: Set<string>) {
  if (!isObject(data) || !Array.isArray(data.proxies)) return

  for (const proxy of data.proxies) {
    const key = JSON.stringify(proxy)
    if (seen.has(key)) continue
    seen.add(key)
    proxies.push(proxy)
  }
}

async function expandSub2ApiInputs(files: File[], logs: ConvertLog[]): Promise<{ sources: Sub2ApiSourceFile[]; readSkipped: number }> {
  const sources: Sub2ApiSourceFile[] = []
  let readSkipped = 0

  for (const file of files) {
    const lowerName = file.name.toLowerCase()

    if (lowerName.endsWith(".zip")) {
      try {
        const zip = await JSZip.loadAsync(file)
        const entries = Object.values(zip.files)
          .filter((entry) => {
            if (entry.dir) return false
            const normalizedName = entry.name.replace(/\\/g, "/")
            const parts = normalizedName.split("/")
            const basename = parts.at(-1) ?? ""
            if (parts.includes("__MACOSX")) return false
            if (basename.startsWith("._")) return false
            if (basename === ".DS_Store") return false
            return normalizedName.toLowerCase().endsWith(".json")
          })
          .sort((a, b) => a.name.localeCompare(b.name))

        if (entries.length === 0) {
          readSkipped += 1
          logs.push({ level: "warning", message: `压缩包 ${file.name} 中没有 JSON 文件` })
          continue
        }

        logs.push({ level: "info", message: `压缩包 ${file.name}：发现 ${entries.length} 个 JSON 文件` })

        for (const entry of entries) {
          try {
            const text = await entry.async("text")
            sources.push({ name: `${file.name}/${entry.name}`, data: JSON.parse(text) })
          } catch (error) {
            readSkipped += 1
            logs.push({
              level: "error",
              message: `跳过 ${file.name}/${entry.name}：${error instanceof Error ? error.message : String(error)}`,
            })
          }
        }
      } catch (error) {
        readSkipped += 1
        logs.push({ level: "error", message: `无法读取压缩包 ${file.name}：${error instanceof Error ? error.message : String(error)}` })
      }
      continue
    }

    if (lowerName.endsWith(".json")) {
      try {
        sources.push({ name: file.name, data: await readJsonFile(file) })
      } catch (error) {
        readSkipped += 1
        logs.push({ level: "error", message: `跳过 ${file.name}：${error instanceof Error ? error.message : String(error)}` })
      }
      continue
    }

    readSkipped += 1
    logs.push({ level: "warning", message: `跳过 ${file.name}：仅支持 .json 或 .zip` })
  }

  return { sources, readSkipped }
}

export async function mergeSub2ApiFiles(files: File[]): Promise<MergeSub2ApiResult> {
  const logs: ConvertLog[] = []
  const accounts: Sub2ApiAccount[] = []
  const proxies: unknown[] = []
  const seenProxies = new Set<string>()
  const seenAccounts = new Set<string>()
  const { sources, readSkipped } = await expandSub2ApiInputs(files, logs)
  let skipped = readSkipped
  let duplicate = 0
  let accountTotal = 0

  for (const source of sources) {
    let sourceAccounts: JsonObject[]

    try {
      sourceAccounts = parseAccounts(source.data)
      mergeProxies(source.data, proxies, seenProxies)
    } catch (error) {
      skipped += 1
      logs.push({ level: "error", message: `跳过 ${source.name}：${error instanceof Error ? error.message : String(error)}` })
      continue
    }

    logs.push({ level: "info", message: `${source.name}：读取到 ${sourceAccounts.length} 个账号` })

    for (const [index, rawAccount] of sourceAccounts.entries()) {
      accountTotal += 1
      const account = normalizeAccount(rawAccount)

      if (!account) {
        skipped += 1
        logs.push({ level: "warning", message: `跳过 ${source.name} 第 ${index + 1} 条：没有 access_token / refresh_token` })
        continue
      }

      const key = accountDedupKey(account)
      if (key && seenAccounts.has(key)) {
        duplicate += 1
        skipped += 1
        logs.push({ level: "warning", message: `重复跳过 ${source.name} 第 ${index + 1} 条：${account.name}` })
        continue
      }

      if (key) seenAccounts.add(key)
      accounts.push(account)
      logs.push({ level: "success", message: `OK: ${source.name} 第 ${index + 1} 条 ${account.name}` })
    }
  }

  return {
    output: {
      exported_at: utcNowIso(),
      proxies,
      accounts,
    },
    logs,
    total: accountTotal,
    sourceTotal: sources.length,
    success: accounts.length,
    skipped,
    duplicate,
  }
}

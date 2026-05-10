import JSZip from "jszip"

import { getAny, isObject, readJsonFile, toStringValue, utcNowIso, type ConvertLog, type JsonObject } from "./common"

export type Sub2ApiAccount = {
  name: string
  platform: "openai"
  type: "oauth"
  credentials: JsonObject
  extra: JsonObject
  concurrency: number
  priority: number
  rate_multiplier: number
  auto_pause_on_expired: boolean
  disabled?: boolean
}

type CpaSourceFile = {
  name: string
  data: unknown
}

export type CpaToSub2ApiOptions = {
  concurrency?: number
  priority?: number
  rateMultiplier?: number
  autoPauseOnExpired?: boolean
  inheritDisabled?: boolean
  keepSourceInfo?: boolean
}

export type CpaToSub2ApiResult = {
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
}

function convertOne(cpa: JsonObject, sourceName: string, options: Required<CpaToSub2ApiOptions>): Sub2ApiAccount {
  const accessToken = getAny(cpa, ["access_token", "accessToken", "access", "token"])
  const refreshToken = getAny(cpa, ["refresh_token", "refreshToken", "refresh"])
  const idToken = getAny(cpa, ["id_token", "idToken"])
  const accountId = getAny(cpa, ["account_id", "accountId", "chatgpt_account_id"])
  const email = getAny(cpa, ["email", "account", "username", "name"])
  const expired = getAny(cpa, ["expired", "expires_at", "expire_at", "expiresAt", "expires"])
  const lastRefresh = getAny(cpa, ["last_refresh", "lastRefresh", "updated_at", "updatedAt"])
  const disabled = Boolean(getAny(cpa, ["disabled", "disable", "is_disabled", "isDisabled"], false))
  const sourceType = getAny(cpa, ["type"], "codex")

  const credentials = Object.fromEntries(
    Object.entries({
      access_token: accessToken,
      chatgpt_account_id: accountId,
      email,
      expires_at: expired,
      id_token: idToken,
      refresh_token: refreshToken,
    }).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  )

  const extra: JsonObject = {}

  if (options.keepSourceInfo) {
    extra.source_format = "cpa_auth_file"
    extra.source_name = sourceName
    extra.source_type = sourceType
  }

  if (lastRefresh !== undefined && lastRefresh !== null && lastRefresh !== "") {
    extra.last_refresh = lastRefresh
  }

  const account: Sub2ApiAccount = {
    name: toStringValue(email || accountId || sourceName.replace(/\.json$/i, "")),
    platform: "openai",
    type: "oauth",
    credentials,
    extra,
    concurrency: options.concurrency,
    priority: options.priority,
    rate_multiplier: options.rateMultiplier,
    auto_pause_on_expired: options.autoPauseOnExpired,
  }

  if (options.inheritDisabled && disabled) account.disabled = true

  return account
}

async function expandCpaInputs(files: File[], logs: ConvertLog[]): Promise<{ sources: CpaSourceFile[]; readSkipped: number }> {
  const sources: CpaSourceFile[] = []
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

export async function convertCpaFilesToSub2Api(files: File[], options: CpaToSub2ApiOptions = {}): Promise<CpaToSub2ApiResult> {
  const normalizedOptions: Required<CpaToSub2ApiOptions> = {
    concurrency: options.concurrency ?? 10,
    priority: options.priority ?? 1,
    rateMultiplier: options.rateMultiplier ?? 1,
    autoPauseOnExpired: options.autoPauseOnExpired ?? true,
    inheritDisabled: options.inheritDisabled ?? true,
    keepSourceInfo: options.keepSourceInfo ?? true,
  }
  const logs: ConvertLog[] = []
  const accounts: Sub2ApiAccount[] = []
  const { sources, readSkipped } = await expandCpaInputs(files, logs)
  let skipped = readSkipped

  for (const [index, source] of sources.entries()) {
    try {
      if (!isObject(source.data)) throw new Error("CPA 认证文件必须是 JSON 对象")

      const account = convertOne(source.data, source.name, normalizedOptions)
      const credentials = account.credentials || {}

      if (!credentials.access_token && !credentials.refresh_token) {
        skipped += 1
        logs.push({ level: "warning", message: `跳过 ${source.name}：没有 access_token / refresh_token` })
        continue
      }

      accounts.push(account)
      logs.push({ level: "success", message: `OK: 第 ${index + 1} 条 ${source.name}` })
    } catch (error) {
      skipped += 1
      logs.push({ level: "error", message: `跳过 ${source.name}：${error instanceof Error ? error.message : String(error)}` })
    }
  }

  return {
    output: {
      exported_at: utcNowIso(),
      proxies: [],
      accounts,
    },
    logs,
    total: sources.length,
    sourceTotal: files.length,
    success: accounts.length,
    skipped,
  }
}

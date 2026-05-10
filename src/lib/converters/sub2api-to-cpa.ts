import JSZip from "jszip"

import { getAny, isObject, normalizeTime, readJsonFile, safeFilename, toBool, type ConvertLog, type JsonObject } from "./common"

export type CpaAuthFile = {
  access_token: unknown
  account_id: unknown
  disabled: boolean
  email: unknown
  expired: string
  id_token: unknown
  last_refresh: string
  refresh_token: unknown
  type: "codex"
}

export type CpaOutputFile = {
  filename: string
  data: CpaAuthFile
}

type Sub2ApiSourceFile = {
  name: string
  data: unknown
}

export type Sub2ApiToCpaResult = {
  files: CpaOutputFile[]
  logs: ConvertLog[]
  total: number
  sourceTotal: number
  success: number
  skipped: number
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

function convertOne(account: JsonObject): CpaAuthFile {
  const credentials = isObject(account.credentials) ? account.credentials : account
  const extra = isObject(account.extra) ? account.extra : {}

  const accessToken = getAny(credentials, ["access_token", "accessToken", "access", "token"])
  const refreshToken = getAny(credentials, ["refresh_token", "refreshToken", "refresh"])
  const idToken = getAny(credentials, ["id_token", "idToken"])
  const accountId = getAny(credentials, [
    "account_id",
    "accountId",
    "chatgpt_account_id",
    "organization_id",
    "sub",
    "user_id",
    "userId",
    "id",
  ])

  const email = getAny(credentials, ["email", "account", "username", "user", "name"]) || getAny(account, ["name", "email", "account", "username"])
  const expiredRaw = getAny(credentials, ["expired", "expires_at", "expire_at", "expiresAt", "expiry", "expireTime", "expires"])
  const lastRefreshRaw =
    getAny(extra, ["last_refresh", "lastRefresh", "updated_at", "updatedAt", "refresh_time", "refreshTime", "created_at", "createdAt"]) ||
    getAny(credentials, ["last_refresh", "lastRefresh", "updated_at", "updatedAt", "refresh_time", "refreshTime", "created_at", "createdAt"]) ||
    getAny(account, ["last_refresh", "lastRefresh", "updated_at", "updatedAt", "created_at", "createdAt"])
  const disabledRaw = getAny(account, ["disabled", "disable", "is_disabled", "isDisabled"], false)

  return {
    access_token: accessToken,
    account_id: accountId,
    disabled: toBool(disabledRaw),
    email,
    expired: normalizeTime(expiredRaw, 30),
    id_token: idToken,
    last_refresh: normalizeTime(lastRefreshRaw, -1),
    refresh_token: refreshToken,
    type: "codex",
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

export async function convertSub2ApiFilesToCpa(files: File[]): Promise<Sub2ApiToCpaResult> {
  const logs: ConvertLog[] = []
  const outputFiles: CpaOutputFile[] = []
  const usedNames = new Set<string>()
  const { sources, readSkipped } = await expandSub2ApiInputs(files, logs)
  let skipped = readSkipped
  let accountIndex = 0

  for (const source of sources) {
    let accounts: JsonObject[]
    try {
      accounts = parseAccounts(source.data)
    } catch (error) {
      skipped += 1
      logs.push({ level: "error", message: `跳过 ${source.name}：${error instanceof Error ? error.message : String(error)}` })
      continue
    }

    for (const account of accounts) {
      accountIndex += 1
      const cpa = convertOne(account)

      if (!cpa.access_token && !cpa.refresh_token) {
        skipped += 1
        logs.push({ level: "warning", message: `跳过 ${source.name} 第 ${accountIndex} 条：没有 access_token / refresh_token` })
        continue
      }

      const name = cpa.email || cpa.account_id || `account-${accountIndex}`
      const baseFilename = `codex-${safeFilename(name)}.json`
      let filename = baseFilename
      let suffix = 2

      while (usedNames.has(filename)) {
        filename = `codex-${safeFilename(name)}-${suffix}.json`
        suffix += 1
      }

      usedNames.add(filename)
      outputFiles.push({ filename, data: cpa })
      logs.push({ level: "success", message: `OK: ${filename}` })
    }
  }

  return {
    files: outputFiles,
    logs,
    total: accountIndex,
    sourceTotal: sources.length,
    success: outputFiles.length,
    skipped,
  }
}

export async function convertSub2ApiFileToCpa(file: File): Promise<Sub2ApiToCpaResult> {
  return convertSub2ApiFilesToCpa([file])
}

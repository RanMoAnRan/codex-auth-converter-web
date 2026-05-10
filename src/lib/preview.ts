import type { JsonObject } from "@/lib/converters/common"

export type PreviewAccount = {
  name?: unknown
  email?: unknown
  accountId?: unknown
  accessToken?: unknown
  refreshToken?: unknown
  disabled?: unknown
}

export function previewFromSub2ApiAccount(account: { name?: unknown; credentials?: JsonObject; disabled?: unknown }): PreviewAccount {
  const credentials = account.credentials || {}
  return {
    name: account.name,
    email: credentials.email,
    accountId: credentials.chatgpt_account_id || credentials.account_id,
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token,
    disabled: account.disabled,
  }
}

export function previewFromCpaFile(file: { data: JsonObject }): PreviewAccount {
  return {
    name: file.data.email || file.data.account_id,
    email: file.data.email,
    accountId: file.data.account_id,
    accessToken: file.data.access_token,
    refreshToken: file.data.refresh_token,
    disabled: file.data.disabled,
  }
}

function pad(value: number) {
  return String(value).padStart(2, "0")
}

export function timestampForFilename(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function stripKnownExtension(name: string) {
  return name.replace(/\.(json|zip)$/i, "")
}

export function outputBaseName(files: File[], fallback: string) {
  if (files.length === 1) return stripKnownExtension(files[0]?.name || fallback)
  return `${fallback}-${timestampForFilename()}`
}

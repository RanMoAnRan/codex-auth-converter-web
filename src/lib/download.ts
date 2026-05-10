import JSZip from "jszip"

export function downloadTextFile(filename: string, content: string, type = "application/json;charset=utf-8") {
  const blob = new Blob([content], { type })
  downloadBlob(filename, blob)
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function downloadJsonZip(filename: string, files: Array<{ filename: string; data: unknown }>) {
  const zip = new JSZip()

  for (const file of files) {
    zip.file(file.filename, JSON.stringify(file.data, null, 2))
  }

  const blob = await zip.generateAsync({ type: "blob" })
  downloadBlob(filename, blob)
}

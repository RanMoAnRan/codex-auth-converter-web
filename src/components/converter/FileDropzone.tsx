import { UploadCloudIcon, XIcon } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FileDropzoneProps = {
  title: string
  description: string
  files: File[]
  multiple?: boolean
  accept?: string
  buttonText?: string
  allowZip?: boolean
  onFilesChange: (files: File[]) => void
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function FileDropzone({
  title,
  description,
  files,
  multiple = false,
  accept = "application/json,.json",
  buttonText = "选择 JSON 文件",
  allowZip = accept.includes(".zip"),
  onFilesChange,
}: FileDropzoneProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const acceptFiles = (incoming: FileList | File[]) => {
    const incomingFiles = Array.from(incoming)
    const acceptedFiles = incomingFiles.filter((file) => {
      const lowerName = file.name.toLowerCase()
      return lowerName.endsWith(".json") || (allowZip && lowerName.endsWith(".zip"))
    })
    const rejectedCount = incomingFiles.length - acceptedFiles.length

    if (rejectedCount > 0) {
      toast.warning(`已忽略 ${rejectedCount} 个不支持的文件，仅支持 ${allowZip ? ".json / .zip" : ".json"}`)
    }

    if (acceptedFiles.length === 0) return

    if (!multiple) {
      onFilesChange(acceptedFiles.slice(0, 1))
      return
    }

    const merged = [...files]
    const keys = new Set(merged.map(fileKey))
    let duplicatedCount = 0

    for (const file of acceptedFiles) {
      const key = fileKey(file)
      if (keys.has(key)) {
        duplicatedCount += 1
        continue
      }
      keys.add(key)
      merged.push(file)
    }

    if (duplicatedCount > 0) toast.info(`已忽略 ${duplicatedCount} 个重复文件`)
    onFilesChange(merged)
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const visibleFiles = expanded ? files : files.slice(0, 8)

  return (
    <Card
      className={cn(
        "border-dashed bg-card/70 transition-colors",
        dragging && "border-primary bg-accent/40",
      )}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        acceptFiles(event.dataTransfer.files)
      }}
    >
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <UploadCloudIcon />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <label htmlFor={inputId} className="cursor-pointer">{buttonText}</label>
          </Button>
          {files.length > 0 ? (
            <Button variant="ghost" onClick={() => onFilesChange([])}>
              <XIcon data-icon="inline-start" />
              清空
            </Button>
          ) : null}
        </div>
        <input
          id={inputId}
          className="hidden"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            acceptFiles(event.target.files ?? [])
            event.currentTarget.value = ""
          }}
        />
        {files.length > 0 ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="text-xs text-muted-foreground">
              已选择 {files.length} 个文件，共 {formatFileSize(totalSize)}
            </div>
            <div className="flex max-h-32 flex-wrap justify-center gap-2 overflow-auto">
              {visibleFiles.map((file) => (
                <Badge key={fileKey(file)} variant="secondary" className="max-w-64 gap-1 truncate pr-1">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    className="ml-1 rounded-full p-0.5 hover:bg-background/70"
                    aria-label={`移除 ${file.name}`}
                    onClick={() => onFilesChange(files.filter((item) => fileKey(item) !== fileKey(file)))}
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
              {files.length > 8 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? "收起" : `展开全部 ${files.length} 个`}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

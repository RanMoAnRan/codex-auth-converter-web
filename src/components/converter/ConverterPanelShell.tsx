import type { ReactNode } from "react"

import { AccountPreview } from "@/components/converter/AccountPreview"
import { ConvertSummary } from "@/components/converter/ConvertSummary"
import { FileDropzone } from "@/components/converter/FileDropzone"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ConvertLog } from "@/lib/converters/common"
import type { PreviewAccount } from "@/lib/preview"

type ConverterPanelShellProps = {
  title: string
  description: string
  dropzone: {
    title: string
    description: string
    accept: string
    buttonText: string
    files: File[]
    multiple?: boolean
    onFilesChange: (files: File[]) => void
  }
  actionInfo: {
    icon: ReactNode
    title: string
    description: string
  }
  actions: ReactNode
  afterActions?: ReactNode
  progress?: ReactNode
  previewAccounts: PreviewAccount[]
  summary: {
    total: number
    success: number
    skipped: number
    logs: ConvertLog[]
  }
}

export function ConverterPanelShell({
  title,
  description,
  dropzone,
  actionInfo,
  actions,
  afterActions,
  progress,
  previewAccounts,
  summary,
}: ConverterPanelShellProps) {
  return (
    <Card className="overflow-hidden bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur">
      <CardHeader className="gap-2">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FileDropzone {...dropzone} />
        <Alert className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {actionInfo.icon}
            <div className="flex flex-col gap-1">
              <AlertTitle>{actionInfo.title}</AlertTitle>
              <AlertDescription>{actionInfo.description}</AlertDescription>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3 sm:justify-end">
            {actions}
          </div>
        </Alert>
        {afterActions}
        {progress}
        <AccountPreview accounts={previewAccounts} />
        <ConvertSummary {...summary} />
      </CardContent>
    </Card>
  )
}

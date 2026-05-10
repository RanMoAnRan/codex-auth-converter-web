import { ArchiveIcon, RefreshCwIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConverterPanelShell } from "@/components/converter/ConverterPanelShell"
import { previewFromCpaFile } from "@/lib/preview"
import { Button } from "@/components/ui/button"
import { convertSub2ApiFilesToCpa, type Sub2ApiToCpaResult } from "@/lib/converters/sub2api-to-cpa"
import { downloadJsonZip } from "@/lib/download"
import { outputBaseName } from "@/lib/naming"

export function Sub2ApiToCpaPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<Sub2ApiToCpaResult | null>(null)
  const [converting, setConverting] = useState(false)
  const outputFilename = useMemo(() => `${outputBaseName(files, "cpa-auth-out")}-cpa.zip`, [files])

  const downloadResult = async (nextResult = result) => {
    if (!nextResult) return
    await downloadJsonZip(outputFilename, nextResult.files)
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.warning("请先选择 sub2api 导出 JSON 或 ZIP")
      return
    }

    setConverting(true)
    try {
      const nextResult = await convertSub2ApiFilesToCpa(files)
      setResult(nextResult)
      if (nextResult.success > 0) {
        await downloadResult(nextResult)
        toast.success(`转换完成：成功 ${nextResult.success}，跳过 ${nextResult.skipped}，已下载 ${outputFilename}`)
      } else {
        toast.warning(`转换完成：成功 0，跳过 ${nextResult.skipped}，没有可下载文件`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "转换失败")
    } finally {
      setConverting(false)
    }
  }

  return (
    <ConverterPanelShell
      title="sub2api 导出拆分成 CPA Codex 文件"
      description="选择一个或多个 sub2api JSON / ZIP，转换为 CPA 压缩包。"
      dropzone={{
        title: "拖入 sub2api 导出文件",
        description: "支持 JSON、多个 JSON，或包含多个 sub2api JSON 的 ZIP；转换后会打包下载。",
        accept: "application/json,.json,application/zip,.zip",
        buttonText: "选择 JSON / ZIP 文件",
        files,
        multiple: true,
        onFilesChange: (nextFiles) => {
          setFiles(nextFiles)
          setResult(null)
        },
      }}
      actionInfo={{
        icon: <ArchiveIcon />,
        title: "输出格式",
        description: "每个账号导出为 `codex-email.json`；重名会自动追加序号，转换成功后自动下载 ZIP。",
      }}
      actions={(
        <Button variant="outline" onClick={handleConvert} disabled={converting || files.length === 0}>
          <RefreshCwIcon data-icon="inline-start" />
          {converting ? "转换中" : "开始转换并下载"}
        </Button>
      )}
      previewAccounts={(result?.files ?? []).map(previewFromCpaFile)}
      summary={{
        total: result?.total ?? 0,
        success: result?.success ?? 0,
        skipped: result?.skipped ?? 0,
        logs: result?.logs ?? [],
      }}
    />
  )
}

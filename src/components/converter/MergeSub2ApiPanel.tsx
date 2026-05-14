import { CombineIcon, RefreshCwIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConverterPanelShell } from "@/components/converter/ConverterPanelShell"
import { Button } from "@/components/ui/button"
import { mergeSub2ApiFiles, type MergeSub2ApiResult } from "@/lib/converters/merge-sub2api"
import { downloadTextFile } from "@/lib/download"
import { outputBaseName } from "@/lib/naming"
import { previewFromSub2ApiAccount } from "@/lib/preview"

export function MergeSub2ApiPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<MergeSub2ApiResult | null>(null)
  const [converting, setConverting] = useState(false)
  const outputFilename = useMemo(() => `${outputBaseName(files, "merged-sub2api-accounts")}-sub2api.json`, [files])

  const downloadResult = (nextResult = result) => {
    if (!nextResult) return
    downloadTextFile(outputFilename, JSON.stringify(nextResult.output, null, 2))
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.warning("请先选择 sub2api JSON 文件或 ZIP 压缩包")
      return
    }

    setConverting(true)
    try {
      const nextResult = await mergeSub2ApiFiles(files)
      setResult(nextResult)
      if (nextResult.success > 0) {
        downloadResult(nextResult)
        toast.success(`合并完成：成功 ${nextResult.success}，跳过 ${nextResult.skipped}，重复 ${nextResult.duplicate}，已下载 ${outputFilename}`)
      } else {
        toast.warning(`合并完成：成功 0，跳过 ${nextResult.skipped}，没有可下载账号`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "合并失败")
    } finally {
      setConverting(false)
    }
  }

  return (
    <ConverterPanelShell
      title="多个 sub2api 导出合并成一个大 JSON"
      description="支持多个单账号 sub2api JSON，也支持 ZIP 批量导入；重复账号会自动跳过。"
      dropzone={{
        title: "拖入 sub2api 导出文件",
        description: "可以直接多选 JSON，也可以上传包含多个 sub2api JSON 的 ZIP。",
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
        icon: <CombineIcon />,
        title: "合并规则",
        description: "会把所有 accounts 展平合并，保留 proxies，按 email / 用户 ID / refresh_token / access_token / name 去重。",
      }}
      actions={(
        <Button variant="outline" onClick={handleConvert} disabled={converting || files.length === 0}>
          <RefreshCwIcon data-icon="inline-start" />
          {converting ? "合并中" : "开始合并并下载"}
        </Button>
      )}
      previewAccounts={(result?.output.accounts ?? []).map(previewFromSub2ApiAccount)}
      summary={{
        total: result?.total ?? 0,
        success: result?.success ?? 0,
        skipped: result?.skipped ?? 0,
        logs: result?.logs ?? [],
      }}
    />
  )
}

import { RefreshCwIcon, Settings2Icon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ConverterPanelShell } from "@/components/converter/ConverterPanelShell"
import { previewFromSub2ApiAccount } from "@/lib/preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { convertCpaFilesToSub2Api, type CpaToSub2ApiOptions, type CpaToSub2ApiResult } from "@/lib/converters/cpa-to-sub2api"
import { downloadTextFile } from "@/lib/download"
import { outputBaseName } from "@/lib/naming"

const defaultOptions: Required<CpaToSub2ApiOptions> = {
  concurrency: 10,
  priority: 1,
  rateMultiplier: 1,
  autoPauseOnExpired: true,
  inheritDisabled: true,
  keepSourceInfo: true,
}

export function CpaToSub2ApiPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<CpaToSub2ApiResult | null>(null)
  const [converting, setConverting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [options, setOptions] = useState(defaultOptions)

  const progress = useMemo(() => {
    if (!result || result.total === 0) return 0
    return Math.round((result.success / result.total) * 100)
  }, [result])

  const outputFilename = useMemo(() => `${outputBaseName(files, "sub2api-accounts")}-sub2api.json`, [files])

  const downloadResult = (nextResult = result) => {
    if (!nextResult) return
    downloadTextFile(outputFilename, JSON.stringify(nextResult.output, null, 2))
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.warning("请先选择 CPA JSON 文件或 ZIP 压缩包")
      return
    }

    setConverting(true)
    try {
      const nextResult = await convertCpaFilesToSub2Api(files, options)
      setResult(nextResult)
      if (nextResult.success > 0) {
        downloadResult(nextResult)
        toast.success(`转换完成：成功 ${nextResult.success}，跳过 ${nextResult.skipped}，已下载 ${outputFilename}`)
      } else {
        toast.warning(`转换完成：成功 0，跳过 ${nextResult.skipped}，没有可下载账号`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "转换失败")
    } finally {
      setConverting(false)
    }
  }

  return (
    <ConverterPanelShell
      title="CPA JSON 批量合并成 sub2api 导出"
      description="支持多份 JSON，或一个/多个包含 JSON 的 ZIP。"
      dropzone={{
        title: "拖入 CPA 认证文件",
        description: "可以直接多选 JSON，也可以上传包含多个 CPA JSON 的 ZIP。",
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
        icon: <RefreshCwIcon />,
        title: "输出格式",
        description: "ZIP 内会递归读取所有 JSON；转换成功后会自动下载，也可以再次手动下载。",
      }}
      actions={(
        <>
          <Button variant="outline" onClick={() => setShowAdvanced((value) => !value)}>
            <Settings2Icon data-icon="inline-start" />
            高级设置
          </Button>
          <Button variant="outline" onClick={handleConvert} disabled={converting || files.length === 0}>
            <RefreshCwIcon data-icon="inline-start" />
            {converting ? "转换中" : "开始转换并下载"}
          </Button>
        </>
      )}
      afterActions={showAdvanced ? <AdvancedOptions options={options} onChange={setOptions} onReset={() => setOptions(defaultOptions)} /> : null}
      progress={result ? <Progress value={progress} /> : null}
      previewAccounts={(result?.output.accounts ?? []).map(previewFromSub2ApiAccount)}
      summary={{
        total: result?.total ?? files.length,
        success: result?.success ?? 0,
        skipped: result?.skipped ?? 0,
        logs: result?.logs ?? [],
      }}
    />
  )
}

function AdvancedOptions({
  options,
  onChange,
  onReset,
}: {
  options: Required<CpaToSub2ApiOptions>
  onChange: (options: Required<CpaToSub2ApiOptions>) => void
  onReset: () => void
}) {
  const updateNumber = (key: "concurrency" | "priority" | "rateMultiplier", value: string) => {
    const number = Number(value)
    onChange({ ...options, [key]: Number.isFinite(number) ? number : defaultOptions[key] })
  }

  return (
    <Card className="bg-card/70">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">高级设置</div>
            <div className="text-xs text-muted-foreground">改乱了可以一键恢复推荐默认值。</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onReset}>重置默认设置</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
        <Field label="并发数 concurrency" description="写入 sub2api 的 concurrency，表示这个账号允许的并发请求数；不确定就保持 10。">
          <Input type="number" min={1} value={options.concurrency} onChange={(event) => updateNumber("concurrency", event.target.value)} />
        </Field>
        <Field label="优先级 priority" description="写入 sub2api 的 priority，用于账号调度优先级；不确定就保持 1。">
          <Input type="number" value={options.priority} onChange={(event) => updateNumber("priority", event.target.value)} />
        </Field>
        <Field label="速率倍率 rate_multiplier" description="写入 sub2api 的 rate_multiplier，1 表示不额外调整速率。">
          <Input type="number" step="0.1" value={options.rateMultiplier} onChange={(event) => updateNumber("rateMultiplier", event.target.value)} />
        </Field>
        <CheckField label="过期自动暂停 auto_pause_on_expired" description="账号过期后让 sub2api 自动暂停，建议开启。" checked={options.autoPauseOnExpired} onChange={(checked) => onChange({ ...options, autoPauseOnExpired: checked })} />
        <CheckField label="继承禁用状态 disabled" description="如果 CPA 原文件里 disabled=true，导出后也保持禁用。" checked={options.inheritDisabled} onChange={(checked) => onChange({ ...options, inheritDisabled: checked })} />
        <CheckField label="保留来源信息 extra" description="把原文件名、来源类型等写入 extra，方便以后追踪账号来自哪个文件。" checked={options.keepSourceInfo} onChange={(checked) => onChange({ ...options, keepSourceInfo: checked })} />
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-background/40 p-3">
      <Label>{label}</Label>
      {children}
      <p className="text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function CheckField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex flex-col gap-2 rounded-lg border bg-background/40 px-3 py-2">
      <span className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </span>
      <span className="text-xs leading-5 text-muted-foreground">{description}</span>
    </label>
  )
}

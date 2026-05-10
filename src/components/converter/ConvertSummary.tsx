import { AlertTriangleIcon, CheckCircle2Icon, ClipboardCopyIcon, FileJsonIcon, InfoIcon, XCircleIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type { ConvertLog } from "@/lib/converters/common"

type ConvertSummaryProps = {
  total: number
  success: number
  skipped: number
  logs: ConvertLog[]
}

type LogFilter = "all" | ConvertLog["level"]

const levelIcon = {
  success: CheckCircle2Icon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
  error: XCircleIcon,
}

const levelLabel = {
  success: "成功",
  info: "信息",
  warning: "跳过",
  error: "错误",
}

const levelWeight = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
}

const levelRowClass = {
  error: "bg-destructive/8 hover:bg-destructive/12 [&_svg]:text-destructive",
  warning: "bg-yellow-500/10 hover:bg-yellow-500/15 [&_svg]:text-yellow-700",
  info: "bg-muted/60 hover:bg-muted/80 [&_svg]:text-muted-foreground",
  success: "bg-emerald-500/8 hover:bg-emerald-500/12 [&_svg]:text-emerald-700",
}

export function ConvertSummary({ total, success, skipped, logs }: ConvertSummaryProps) {
  const [filter, setFilter] = useState<LogFilter>("all")
  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => levelWeight[a.level] - levelWeight[b.level]),
    [logs],
  )
  const visibleLogs = sortedLogs.filter((log) => filter === "all" || log.level === filter)
  const errorCount = logs.filter((log) => log.level === "error").length
  const warningCount = logs.filter((log) => log.level === "warning").length

  const copyLogs = async () => {
    if (logs.length === 0) return
    const text = sortedLogs.map((log) => `[${levelLabel[log.level]}] ${log.message}`).join("\n")
    await navigator.clipboard.writeText(text)
    toast.success("日志已复制")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="读取" value={total} />
        <Metric label="成功" value={success} />
        <Metric label="跳过" value={skipped} />
      </div>
      {(errorCount > 0 || warningCount > 0) ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          本次有 {errorCount} 个错误、{warningCount} 个跳过项，日志已按失败优先排序。
        </div>
      ) : null}
      <Card className="bg-card/70">
        <CardHeader className="gap-3 pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">转换日志</CardTitle>
              <CardDescription>解析、跳过和导出结果会集中显示在这里。</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={copyLogs} disabled={logs.length === 0}>
              <ClipboardCopyIcon data-icon="inline-start" />
              复制日志
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>全部 {logs.length}</FilterButton>
            <FilterButton active={filter === "error"} onClick={() => setFilter("error")}>错误 {errorCount}</FilterButton>
            <FilterButton active={filter === "warning"} onClick={() => setFilter("warning")}>跳过 {warningCount}</FilterButton>
            <FilterButton active={filter === "success"} onClick={() => setFilter("success")}>成功 {logs.filter((log) => log.level === "success").length}</FilterButton>
            <FilterButton active={filter === "info"} onClick={() => setFilter("info")}>信息 {logs.filter((log) => log.level === "info").length}</FilterButton>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-72">
            {visibleLogs.length > 0 ? (
              <Table>
                <TableBody>
                  {visibleLogs.map((log, index) => {
                    const Icon = levelIcon[log.level]
                    return (
                      <TableRow key={`${log.level}-${index}-${log.message}`} className={cn("transition-colors", levelRowClass[log.level])}>
                        <TableCell className="w-10">
                          <Icon />
                        </TableCell>
                        <TableCell className="text-left text-sm">{log.message}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center gap-3 text-muted-foreground">
                <FileJsonIcon />
                <p className="text-sm">转换日志会显示在这里</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-card/70">
      <CardContent className="flex flex-col gap-0.5 px-2.5 py-2">
        <Badge variant="outline" className="w-fit px-1.5 py-0 text-[11px] leading-4">{label}</Badge>
        <div className="text-xl font-semibold tabular-nums leading-none tracking-tight sm:text-2xl">{value}</div>
      </CardContent>
    </Card>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  )
}

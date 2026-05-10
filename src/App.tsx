import { ArrowRightLeftIcon, FileArchiveIcon, FileJson2Icon, LockKeyholeIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react"

import { CpaToSub2ApiPanel } from "@/components/converter/CpaToSub2ApiPanel"
import { Sub2ApiToCpaPanel } from "@/components/converter/Sub2ApiToCpaPanel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <TooltipProvider>
      <main className="relative min-h-svh overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklch,var(--ring)_26%,transparent),transparent_34%),radial-gradient(circle_at_82%_0%,color-mix(in_oklch,var(--accent)_55%,transparent),transparent_28%),linear-gradient(135deg,color-mix(in_oklch,var(--muted)_55%,transparent),transparent_45%)]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-border/70" />
        <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:py-8">
          <header className="rounded-3xl border bg-card/70 p-5 shadow-2xl shadow-primary/5 backdrop-blur lg:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center">
              <div className="flex min-w-0 flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full px-3 py-1">
                    <SparklesIcon data-icon="inline-start" />
                    本地浏览器转换
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">CPA ↔ sub2api</Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                    Codex Auth Converter
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                    拖入 JSON、检查日志、直接下载可导入文件；所有解析都在浏览器本地完成。
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Feature icon={ShieldCheckIcon} title="不上传" desc="token 本地解析" />
                <Feature icon={ArrowRightLeftIcon} title="双向互转" desc="JSON / ZIP 导入" />
                <Feature icon={FileJson2Icon} title="快速导出" desc="下载 JSON / ZIP" />
              </div>
            </div>
          </header>

          <Tabs defaultValue="cpa-to-sub2api" className="flex flex-col gap-4">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-3xl border bg-card/75 p-2 shadow-lg shadow-primary/5 backdrop-blur group-data-[orientation=horizontal]/tabs:h-auto sm:grid-cols-2">
              <TabsTrigger
                value="cpa-to-sub2api"
                className="group h-auto min-h-[76px] justify-start overflow-visible rounded-2xl border border-transparent bg-transparent px-4 py-3 text-left transition-all after:hidden hover:border-border hover:bg-background/70 hover:shadow-sm data-[state=active]:border-primary/15 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/15"
              >
                <span className="flex w-full items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground">
                    <FileJson2Icon />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-semibold leading-none sm:text-lg">CPA → sub2api</span>
                    <span className="text-xs font-normal text-muted-foreground group-data-[state=active]:text-primary-foreground/75 sm:text-sm">多份认证文件合并导出</span>
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="sub2api-to-cpa"
                className="group h-auto min-h-[76px] justify-start overflow-visible rounded-2xl border border-transparent bg-transparent px-4 py-3 text-left transition-all after:hidden hover:border-border hover:bg-background/70 hover:shadow-sm data-[state=active]:border-primary/15 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/15"
              >
                <span className="flex w-full items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground">
                    <FileArchiveIcon />
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-base font-semibold leading-none sm:text-lg">sub2api → CPA</span>
                    <span className="text-xs font-normal text-muted-foreground group-data-[state=active]:text-primary-foreground/75 sm:text-sm">导出文件拆分为 CPA ZIP</span>
                  </span>
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cpa-to-sub2api" className="m-0">
              <CpaToSub2ApiPanel />
            </TabsContent>
            <TabsContent value="sub2api-to-cpa" className="m-0">
              <Sub2ApiToCpaPanel />
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Toaster richColors position="top-center" />
    </TooltipProvider>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: typeof LockKeyholeIcon; title: string; desc: string }) {
  return (
    <Card className="bg-background/55 shadow-none backdrop-blur">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-sm font-medium">{title}</div>
          <div className="truncate text-xs text-muted-foreground">{desc}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default App

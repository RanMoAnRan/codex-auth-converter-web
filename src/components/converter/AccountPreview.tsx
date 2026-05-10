import { EyeOffIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type { PreviewAccount } from "@/lib/preview"

type AccountPreviewProps = {
  title?: string
  accounts: PreviewAccount[]
}

function mask(value: unknown) {
  const text = String(value || "")
  if (!text) return "-"
  if (text.length <= 12) return "••••"
  return `${text.slice(0, 6)}...${text.slice(-4)}`
}

export function AccountPreview({ title = "账号预览", accounts }: AccountPreviewProps) {
  if (accounts.length === 0) return null

  return (
    <Card className="bg-card/70">
      <CardHeader className="gap-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <EyeOffIcon className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>共 {accounts.length} 条，列表区域固定高度可滚动，token 默认遮罩。</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 max-h-[42vh] min-h-48">
          <Table className="table-fixed">
            <TableBody>
              <TableRow className="text-xs text-muted-foreground">
                <TableCell>账号</TableCell>
                <TableCell>account_id</TableCell>
                <TableCell>access_token</TableCell>
                <TableCell>refresh_token</TableCell>
                <TableCell>状态</TableCell>
              </TableRow>
              {accounts.map((account, index) => (
                <TableRow key={`${String(account.email || account.name || index)}-${index}`}>
                  <TableCell className="w-[30%] truncate text-sm" title={String(account.email || account.name || "-")}>{String(account.email || account.name || "-")}</TableCell>
                  <TableCell className="w-[24%] truncate font-mono text-xs" title={String(account.accountId || "-")}>{String(account.accountId || "-")}</TableCell>
                  <TableCell className="w-[18%] truncate font-mono text-xs">{mask(account.accessToken)}</TableCell>
                  <TableCell className="w-[18%] truncate font-mono text-xs">{mask(account.refreshToken)}</TableCell>
                  <TableCell className="w-[10%] truncate">{account.disabled ? "禁用" : "启用"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

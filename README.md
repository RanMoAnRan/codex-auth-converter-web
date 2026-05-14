# Codex Auth Converter Web

一个用于 **CPA Codex 认证文件** 和 **sub2api 账号导出文件** 互转的纯前端 Web 工具。

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-ready-222222?logo=github&logoColor=white)

## 简介

Codex Auth Converter Web 可以在浏览器里完成 CPA Codex auth JSON 与 sub2api 导出 JSON 的互转，适合批量整理、迁移或备份 Codex 账号认证文件。

主要支持三个方向：

- **CPA → sub2api**：把多个 CPA JSON 合并为一个 sub2api 可导入 JSON。
- **sub2api → CPA**：把一个或多个 sub2api 导出 JSON 拆分为多个 CPA Codex JSON，并打包成 ZIP。
- **sub2api 合并**：把多个单账号或多账号 sub2api JSON / ZIP 合并成一个大的 sub2api JSON。

## 功能特性

- CPA JSON 批量合并为 sub2api 导出文件
- sub2api 导出文件批量拆分为 CPA Codex 文件
- 多个 sub2api 导出文件批量合并为一个大 JSON
- 支持 `.json` 和 `.zip` 上传
- ZIP 内递归读取 JSON 文件
- 文件选择支持追加、去重、单个移除、展开/收起
- 转换成功后自动下载
- 转换日志支持筛选、复制和颜色区分
- 账号预览支持 token 遮罩和固定高度滚动
- CPA → sub2api 支持高级导出配置
- 已内置 GitHub Pages 自动部署工作流

## 快速开始

### 环境要求

- Node.js 22 或更高版本
- npm

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

启动后访问终端输出的地址，通常是：

```text
http://localhost:5173/
```

### 构建生产包

```bash
npm run build
```

构建产物会生成到：

```text
dist/
```

### 本地预览生产包

```bash
npm run preview
```

## 使用说明

### CPA → sub2api

1. 打开页面，选择 `CPA → sub2api`。
2. 上传 CPA JSON 文件，或上传包含 CPA JSON 的 ZIP。
3. 如有需要，展开 `高级设置` 调整导出字段。
4. 点击 `开始转换并下载`。
5. 页面会自动下载生成的 sub2api JSON。
6. 可在页面中查看账号预览、统计数量和转换日志。

输出文件名会根据输入文件自动生成，例如：

```text
example-sub2api.json
sub2api-accounts-20260510-1030-sub2api.json
```

### sub2api → CPA

1. 打开页面，选择 `sub2api → CPA`。
2. 上传一个或多个 sub2api JSON，或上传包含 sub2api JSON 的 ZIP。
3. 点击 `开始转换并下载`。
4. 页面会自动下载 CPA ZIP。
5. ZIP 内每个账号会生成一个 `codex-xxx.json` 文件。

输出文件名会根据输入文件自动生成，例如：

```text
accounts-cpa.zip
cpa-auth-out-20260510-1030-cpa.zip
```

### sub2api 合并

1. 打开页面，选择 `sub2api 合并`。
2. 上传多个 sub2api JSON，或上传包含 sub2api JSON 的 ZIP。
3. 点击 `开始合并并下载`。
4. 页面会自动下载合并后的 sub2api JSON。
5. 合并时会把所有 `accounts` 展平到一个数组里，并按账号标识自动去重。

输出文件名会根据输入文件自动生成，例如：

```text
accounts-sub2api.json
merged-sub2api-accounts-20260514-1030-sub2api.json
```

去重优先级：

```text
credentials.email
credentials.chatgpt_user_id / chatgpt_account_id / account_id
credentials.refresh_token
credentials.access_token
name
```

## CPA → sub2api 高级设置

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `concurrency` | `10` | 写入 sub2api 的并发数。 |
| `priority` | `1` | 写入 sub2api 的账号调度优先级。 |
| `rate_multiplier` | `1` | 写入 sub2api 的速率倍率，`1` 表示不额外调整。 |
| `auto_pause_on_expired` | `true` | 账号过期后是否让 sub2api 自动暂停。 |
| 继承 `disabled` | 开启 | 如果 CPA 原文件里 `disabled=true`，导出后也保持禁用。 |
| 保留来源信息 `extra` | 开启 | 把原文件名、来源类型等写入 `extra`，方便追踪账号来源。 |

高级设置里提供 `重置默认设置`，可以一键恢复推荐默认值。

## 支持的输入格式

### CPA JSON

CPA → sub2api 至少需要存在以下字段之一：

```text
access_token
refresh_token
```

会尽量识别以下常见字段：

```text
access_token / accessToken / access / token
refresh_token / refreshToken / refresh
id_token / idToken
account_id / accountId / chatgpt_account_id
email / account / username / name
expired / expires_at / expire_at / expiresAt / expires
last_refresh / lastRefresh / updated_at / updatedAt
```

### sub2api JSON

sub2api → CPA 支持以下结构：

- 顶层是账号数组
- 顶层对象中包含以下任一数组字段：
  - `accounts`
  - `data`
  - `items`
  - `list`
  - `records`
- 顶层对象本身就是单个账号对象

### sub2api 合并输入

合并功能支持标准 sub2api 导出结构：

```json
{
  "exported_at": "2026-05-13T19:48:36.503Z",
  "proxies": [],
  "accounts": []
}
```

也兼容 `accounts/data/items/list/records` 等列表字段，以及单个账号对象。

## 跳过规则

文件或账号会在以下情况被跳过：

- 文件不是 `.json` 或 `.zip`
- JSON 格式不合法
- JSON 结构无法识别
- CPA JSON 不是对象
- 账号缺少 `access_token` 和 `refresh_token`
- ZIP 中没有真实 JSON 文件

跳过和错误原因会显示在转换日志中。

## 技术栈

- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [JSZip](https://stuk.github.io/jszip/)
- [Sonner](https://sonner.emilkowal.ski/)
- [Lucide React](https://lucide.dev/)

## 项目结构

```text
src/
  App.tsx
  components/
    converter/
      AccountPreview.tsx
      ConvertSummary.tsx
      ConverterPanelShell.tsx
      CpaToSub2ApiPanel.tsx
      FileDropzone.tsx
      Sub2ApiToCpaPanel.tsx
    ui/
      ...ui components
  lib/
    converters/
      common.ts
      cpa-to-sub2api.ts
      merge-sub2api.ts
      sub2api-to-cpa.ts
    download.ts
    naming.ts
    preview.ts
    utils.ts
  main.tsx
```

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run build` | 构建生产包 |
| `npm run preview` | 本地预览生产包 |
| `npm run lint` | 运行 ESLint 检查 |

## 常见问题

### 为什么上传 ZIP 后日志里会出现“发现 N 个 JSON 文件”？

这是 ZIP 解析信息，表示工具在压缩包中发现了多少个 JSON 文件。它不会计入成功账号数，真正转换成功的账号会显示为 `OK: ...`。

### 为什么有些账号被跳过？

最常见原因是该账号没有有效的：

```text
access_token
refresh_token
```

至少存在其中一个字段才会被转换。

### 为什么 sub2api 转 CPA 下载的是 ZIP？

浏览器无法直接写入本地文件夹，所以多个 CPA JSON 会统一打包成 ZIP 下载。

### 为什么 ZIP 里的文件数量和我看到的不一致？

macOS 压缩包可能包含 `__MACOSX/`、`._xxx.json` 或 `.DS_Store`。这些隐藏文件会被自动忽略。

## 安全说明

- 本项目是静态前端工具，不需要后端服务。
- 如果部署到 GitHub Pages 或其他静态托管平台，只会托管前端静态文件。
- 上传的认证 JSON 会包含敏感 token，请只在可信设备和可信页面环境中使用。
- 不建议把真实 token、导出文件或转换结果提交到公开仓库。

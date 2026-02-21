# 项目结构总览 🏗️

FoomClous 采用前后端分离架构，通过移动端友好的 Web 界面和 Telegram 机器人提供云存储中转服务。

## 📂 目录结构

```text
FoomClous/
├── backend/                # 后端 (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── routes/         # API 路由 (文件、存储配置、认证、分享)
│   │   ├── services/       # 核心业务逻辑 (存储提供商、Telegram 机器人、数据库)
│   │   ├── middleware/     # 中间件 (认证、错误处理)
│   │   └── index.ts        # 入口文件
│   ├── uploads/            # 本地上传临时目录 (Local Provider 存储地)
│   └── package.json
│
├── frontend/               # 前端 (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # UI 组件 (Layout, UI 基础组件, 功能页面)
│   │   ├── services/       # API 客户端 (与后端通信)
│   │   ├── hooks/          # 自定义 React Hooks (主题、认证)
│   │   └── App.tsx         # 应用主入口
│   └── package.json
│
├── deploy/                 # 部署配置 (Nginx, Certbot 等)
├── docs/                   # 项目文档中心 (GitHub Pages 源)
├── docker-compose.yml      # Docker 编排配置
└── init.sql                # 数据库初始化脚本
```

## 🚀 技术栈

### 后端
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Networking**: Axios (用于 Telegram & Cloud API)
- **Storage Libs**: `webdav`, `@aws-sdk/client-s3`, `ali-oss`

### 前端
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **I18n**: react-i18next

## 🔄 数据流向

1. **上传流程**：客户端 -> 后端 (临时缓存) -> 存储提供商 (Cloud/Local)。
2. **下载流程**：客户端 -> 后端 -> (如果是 Cloud，则生成签名 URL / 如果是 Local，则流式传输)。
3. **Bot 交互**：Telegram URL -> 后端 (下载到临时文件) -> 后端 (推送到存储源) -> 更新 Bot 消息。

---
[返回文档中心](./README.md)

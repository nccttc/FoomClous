# FoomClous

本地全栈云存储应用

## 技术栈
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL
- **容器化**: Docker

## 快速开始（生产部署）

### 使用 Docker 镜像（推荐）

```bash
# 1. 启动 PostgreSQL
docker run -d \
  --name foomclous-postgres \
  -e POSTGRES_DB=foomclous \
  -e POSTGRES_USER=foomclous \
  -e POSTGRES_PASSWORD=foomclous123 \
  -p 5432:5432 \
  postgres:16-alpine

# 2. 启动后端（数据库表会自动初始化）
docker run -d \
  --name foomclous-backend \
  -e DATABASE_URL=postgresql://foomclous:foomclous123@postgres:5432/foomclous \
  -e PORT=51947 \
  -e UPLOAD_DIR=/data/uploads \
  -e THUMBNAIL_DIR=/data/thumbnails \
  -e CHUNK_DIR=/data/chunks \
  -e CORS_ORIGIN=https://co.zrn.qzz.io \
  -e DOMAIN=co.zrn.qzz.io \
  -p 51947:51947 \
  -v foomclous-data:/data \
  --link foomclous-postgres:postgres \
  cxaryoro/foomclous-backend:latest

# 3. 启动前端
docker run -d \
  --name foomclous-frontend \
  -e VITE_API_URL=https://co.zrn.qzz.io \
  -p 47832:80 \
  cxaryoro/foomclous-frontend:latest
```

**后端启动时会自动读取 schema.sql 并创建数据库表，无需手动操作。**

### 使用 Docker Compose

需要先将 `docker-compose.prod.yml` 上传到服务器，然后：

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 开发模式（本地）

### 1. 安装依赖
```bash
# 后端
cd backend && npm install

# 前端
cd frontend && npm install
```

### 2. 启动服务
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 3. 访问应用
- 前端: http://localhost:5173
- 后端 API: http://localhost:51947

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 47832 | HTTP |
| 后端 API | 51947 | API |
| PostgreSQL | 5432 | 数据库 |

## 项目结构

```
FoomClous/
├── frontend/                 # 前端代码
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
├── backend/                  # 后端代码
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── middleware/      # 中间件
│   │   ├── db/              # 数据库
│   │   └── index.ts         # 入口文件
│   ├── Dockerfile
├── docker-compose.yml          # 开发环境
├── docker-compose.prod.yml      # 生产环境
└── README.md
```

## API 接口

### 文件管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/files` | 获取文件列表 |
| GET | `/api/files/:id` | 获取单个文件信息 |
| GET | `/api/files/:id/preview` | 预览文件 |
| GET | `/api/files/:id/download` | 下载文件 |
| DELETE | `/api/files/:id` | 删除文件 |
| GET | `/api/files/:id/thumbnail` | 获取缩略图 |

### 上传

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/upload` | 上传单个文件 |
| POST | `/api/upload/batch` | 批量上传 |
| POST | `/api/v1/upload/external` | 外部 API 上传（需要 API Key） |

### 存储统计

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/storage/stats` | 获取存储统计 |
| GET | `/api/storage/stats/types` | 获取文件类型统计 |

### 外部 API

外部 API 用于集成第三方应用（如 Telegram Bot）。

请求头示例：
```
X-API-Key: fc_xxxxxx
```

示例：
```bash
curl -X POST http://localhost:51947/api/v1/upload/external \
  -H "X-API-Key: fc_your_api_key" \
  -F "file=@image.png"
```

## 环境变量

| 变量 | 描述 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://foomclous:password@localhost:5432/foomclous` |
| `PORT` | 后端端口 | `51947` |
| `UPLOAD_DIR` | 上传文件目录 | `./data/uploads` |
| `THUMBNAIL_DIR` | 缩略图目录 | `./data/thumbnails` |
| `CORS_ORIGIN` | CORS 来源 | `*` |
| `VITE_API_URL` | 前端 API 地址 | `http://localhost:51947` |

## 功能特性

- ✅ 文件上传（支持拖拽、进度显示）
- ✅ 实时图片预览
- ✅ 自动生成缩略图（WebP 格式）
- ✅ 视频流播放（Range 请求支持）
- ✅ 存储空间统计
- ✅ 外部 API 接口
- ✅ Docker 容器化
- ✅ i18n 国际化支持

## License

MIT

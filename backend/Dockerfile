# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 设置构建时的内存限制，防止在小内存服务器上 build 失败
ENV NODE_OPTIONS="--max-old-space-size=1024"

# 复制依赖文件
# 复制依赖文件
COPY package*.json ./
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build


# Production stage
FROM node:20-alpine

WORKDIR /app

# 安装 sharp 需要的依赖 和 ffmpeg (用于视频处理)
RUN apk add --no-cache vips-dev ffmpeg

# 复制依赖
COPY package*.json ./
RUN npm install --omit=dev

# 复制构建产物
COPY --from=builder /app/dist ./dist
# 复制数据库方案文件 (tsc 不会自动复制非 TS 文件)
COPY --from=builder /app/src/db/schema.sql ./dist/db/schema.sql

# 创建数据目录
RUN mkdir -p /data/uploads /data/thumbnails

# 设置权限
RUN chown -R node:node /app /data

USER node

EXPOSE 51947

CMD ["node", "dist/index.js"]

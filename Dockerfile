# 多阶段构建 Dockerfile for HSKswap Web Application
# 使用 Bun 作为运行时和包管理器

# ============================================
# Stage 1: 依赖安装阶段
# ============================================
FROM oven/bun:1.3.1 AS deps

WORKDIR /app

# 复制包管理文件
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# 安装依赖
RUN bun install --frozen-lockfile

# ============================================
# Stage 2: 构建阶段
# ============================================
FROM oven/bun:1.3.1 AS builder

WORKDIR /app

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# 复制源代码
COPY . .

# 设置构建参数
ARG NODE_ENV=production
ARG BUILD_NUM=0
ARG CLOUDFLARE_ENV=production

ENV NODE_ENV=${NODE_ENV}
ENV BUILD_NUM=${BUILD_NUM}
ENV CLOUDFLARE_ENV=${CLOUDFLARE_ENV}

# 构建生产版本
RUN cd apps/web && bun run build:production

# ============================================
# Stage 3: 运行阶段 (Nginx)
# ============================================
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=builder /app/apps/web/build .

# 复制 Nginx 配置（如果存在）
# 如果没有 nginx.conf 文件，使用默认配置
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json; \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

# Docker 镜像构建文档

本文档说明如何为 HSKswap 项目构建和运行 Docker 镜像。

## 前置要求

- Docker 20.10+ 
- Docker Compose 2.0+ (可选，用于本地开发)
- 至少 8GB 可用磁盘空间

## 项目结构

HSKswap 是一个基于 Bun 和 NX 的 monorepo 项目，包含以下主要应用：

- **Web** (`apps/web/`) - 主要的 Web 应用界面
- **Mobile** (`apps/mobile/`) - React Native 移动应用
- **Extension** (`apps/extension/`) - 浏览器扩展

## Dockerfile

项目根目录包含 `Dockerfile`，用于构建生产环境的 Web 应用镜像。

### 构建阶段

Dockerfile 采用多阶段构建，包含以下阶段：

1. **依赖安装阶段** - 安装所有依赖
2. **构建阶段** - 编译生产版本
3. **运行阶段** - 使用 Nginx 提供静态文件服务

## 构建镜像

### 方法 1: 使用 Docker 命令

```bash
# 构建镜像
docker build -t hskswap:latest .

# 或者指定标签
docker build -t hskswap:v1.0.0 -t hskswap:latest .
```

### 方法 2: 使用构建参数

```bash
# 构建时指定环境变量
docker build \
  --build-arg NODE_ENV=production \
  --build-arg BUILD_NUM=1 \
  -t hskswap:latest .
```

### 方法 3: 使用 Docker Compose

```bash
# 使用 docker-compose.yml 构建
docker-compose build

# 构建并启动
docker-compose up -d
```

## 运行容器

### 基本运行

```bash
# 运行容器
docker run -d \
  --name hskswap \
  -p 3000:80 \
  hskswap:latest
```

### 使用环境变量

```bash
# 运行容器并传递环境变量
docker run -d \
  --name hskswap \
  -p 3000:80 \
  -e REACT_APP_INFURA_KEY=your_key \
  -e REACT_APP_ALCHEMY_KEY=your_key \
  hskswap:latest
```

### 使用环境变量文件

```bash
# 使用 .env 文件
docker run -d \
  --name hskswap \
  -p 3000:80 \
  --env-file .env.production \
  hskswap:latest
```

## 镜像标签和版本

### 标签规范

- `hskswap:latest` - 最新版本
- `hskswap:v1.0.0` - 特定版本
- `hskswap:main` - main 分支构建
- `hskswap:dev` - 开发版本

### 构建特定版本

```bash
# 从特定 Git 标签构建
git checkout v1.0.0
docker build -t hskswap:v1.0.0 .
```

## 推送镜像到 Registry

### 推送到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag hskswap:latest yourusername/hskswap:latest

# 推送镜像
docker push yourusername/hskswap:latest
```

### 推送到私有 Registry

```bash
# 标记镜像
docker tag hskswap:latest registry.example.com/hskswap:latest

# 推送镜像
docker push registry.example.com/hskswap:latest
```

### 推送到 GitHub Container Registry

```bash
# 标记镜像
docker tag hskswap:latest ghcr.io/hashkeychain/hskswap:latest

# 推送镜像
docker push ghcr.io/hashkeychain/hskswap:latest
```

## 优化建议

### 1. 使用 BuildKit

```bash
# 启用 BuildKit 加速构建
DOCKER_BUILDKIT=1 docker build -t hskswap:latest .
```

### 2. 使用缓存挂载

```bash
# 使用缓存挂载加速依赖安装
docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --cache-from hskswap:latest \
  -t hskswap:latest .
```

### 3. 多平台构建

```bash
# 构建多平台镜像 (需要 buildx)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t hskswap:latest \
  --push .
```

## 环境变量配置

### 必需的环境变量

- `REACT_APP_INFURA_KEY` - Infura API Key
- `REACT_APP_ALCHEMY_KEY` - Alchemy API Key
- `REACT_APP_QUICKNODE_ENDPOINT_NAME` - QuickNode 端点名称
- `REACT_APP_QUICKNODE_ENDPOINT_TOKEN` - QuickNode 端点令牌

### 可选的环境变量

- `NODE_ENV` - 环境模式 (production/staging/development)
- `BUILD_NUM` - 构建编号
- `REACT_APP_CHAIN_ID` - 默认链 ID

## 健康检查

容器包含健康检查配置：

```bash
# 检查容器健康状态
docker ps

# 查看健康检查日志
docker inspect --format='{{json .State.Health}}' hskswap
```

## 故障排查

### 构建失败

1. 检查 Docker 版本是否满足要求
2. 确保有足够的磁盘空间
3. 检查网络连接（下载依赖需要）

```bash
# 查看构建日志
docker build --progress=plain -t hskswap:latest .
```

### 容器无法启动

1. 检查端口是否被占用
2. 查看容器日志

```bash
# 查看容器日志
docker logs hskswap

# 实时查看日志
docker logs -f hskswap
```

### 性能问题

1. 使用多阶段构建减少镜像大小
2. 启用 BuildKit 加速构建
3. 使用缓存挂载

## CI/CD 集成

### GitHub Actions

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ghcr.io/hashkeychain/hskswap:latest
            ghcr.io/hashkeychain/hskswap:${{ github.ref_name }}
```

## 安全建议

1. **不要将敏感信息硬编码到镜像中**
   - 使用环境变量或密钥管理服务
   - 使用 Docker secrets 或 Kubernetes secrets

2. **定期更新基础镜像**
   - 使用最新的官方基础镜像
   - 定期扫描镜像漏洞

3. **最小权限原则**
   - 使用非 root 用户运行容器
   - 限制容器权限

4. **镜像扫描**
   ```bash
   # 使用 Trivy 扫描镜像
   trivy image hskswap:latest
   ```

## 常见问题

### Q: 镜像太大怎么办？

A: 使用多阶段构建，只保留必要的文件，移除开发依赖。

### Q: 构建时间太长？

A: 
- 使用 BuildKit 和缓存
- 优化 Dockerfile 层顺序
- 使用 .dockerignore 排除不必要的文件

### Q: 如何更新镜像？

A: 
```bash
# 拉取最新代码
git pull

# 重新构建
docker build -t hskswap:latest .

# 重启容器
docker restart hskswap
```

## 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Dockerfile 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Bun 文档](https://bun.sh/docs)
- [NX 文档](https://nx.dev/)

## 支持

如有问题，请提交 Issue 到 [GitHub Repository](https://github.com/HashKeyChain/HSKswap)。

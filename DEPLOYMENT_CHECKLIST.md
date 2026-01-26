# CI/CD 部署检查清单

本文档列出了完成线上 CI/CD 部署所需的所有文件和配置。

## ✅ 已创建的文件

### 核心文件
- ✅ `Dockerfile` - Docker 镜像构建文件
- ✅ `.dockerignore` - Docker 构建忽略文件
- ✅ `docker-compose.yml` - Docker Compose 配置（用于本地开发）

### CI/CD Workflows
- ✅ `.github/workflows/docker-build-push.yml` - 自动构建和推送 Docker 镜像
- ✅ `.github/workflows/docker-deploy.yml` - 自动部署工作流

### 部署脚本
- ✅ `scripts/deploy.sh` - 部署脚本
- ✅ `scripts/rollback.sh` - 回滚脚本
- ✅ `scripts/health-check.sh` - 健康检查脚本

### 文档
- ✅ `DOCKER_BUILD.md` - Docker 构建详细文档

## 📋 需要配置的项目

### 1. GitHub Secrets（必需）

在 GitHub 仓库设置中添加以下 Secrets：

**如果使用 GitHub Container Registry (ghcr.io):**
- 不需要额外配置，使用默认的 `GITHUB_TOKEN` 即可

**如果使用其他 Registry (如 Docker Hub):**
- `DOCKER_USERNAME` - Docker Hub 用户名
- `DOCKER_PASSWORD` - Docker Hub 密码或访问令牌

**如果使用私有服务器部署:**
- `DEPLOY_SSH_KEY` - SSH 私钥（用于连接到部署服务器）
- `DEPLOY_HOST` - 部署服务器地址
- `DEPLOY_USER` - 部署服务器用户名

### 2. 环境变量文件（必需）

创建以下文件（不要提交到 Git）：

```bash
# 生产环境
.env.production

# 测试环境
.env.staging
```

参考 `.env.production.example` 和 `.env.staging.example` 的格式。

### 3. 服务器配置（如果使用服务器部署）

#### 在部署服务器上安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 配置 SSH 访问

```bash
# 在本地生成 SSH 密钥对（如果还没有）
ssh-keygen -t ed25519 -C "deploy@hskswap"

# 将公钥添加到服务器
ssh-copy-id user@your-server-ip
```

### 4. 更新部署脚本（可选）

如果使用自定义部署方式，需要修改 `.github/workflows/docker-deploy.yml` 中的部署步骤。

## 🚀 部署流程

### 自动部署（推荐）

1. **推送到 main 分支**
   ```bash
   git push origin main
   ```
   - 自动触发 `docker-build-push.yml`
   - 构建并推送镜像到 GitHub Container Registry

2. **手动触发部署**
   - 在 GitHub Actions 中运行 `docker-deploy.yml`
   - 选择环境和镜像标签

### 手动部署

```bash
# 1. 设置环境变量
export DOCKER_REGISTRY=ghcr.io
export DOCKER_IMAGE_NAME=hashkeychain/hskswap
export PORT=3000

# 2. 部署到测试环境
./scripts/deploy.sh staging latest

# 3. 部署到生产环境
./scripts/deploy.sh production latest
```

## 🔍 验证部署

### 检查容器状态

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs hskswap -f

# 健康检查
./scripts/health-check.sh
```

### 访问应用

- 测试环境: http://your-server-ip:3000
- 生产环境: http://your-domain.com

## 🔄 回滚

如果部署出现问题，可以快速回滚：

```bash
# 回滚到指定版本
./scripts/rollback.sh v1.0.0

# 或回滚到上一个标签
./scripts/rollback.sh previous
```

## 📊 监控和日志

### 查看日志

```bash
# 实时日志
docker logs -f hskswap

# 最近 100 行日志
docker logs --tail 100 hskswap

# 带时间戳的日志
docker logs -f -t hskswap
```

### 资源监控

```bash
# 查看容器资源使用
docker stats hskswap

# 查看容器详细信息
docker inspect hskswap
```

## 🛡️ 安全建议

1. **不要提交敏感信息**
   - `.env.production` 和 `.env.staging` 应在 `.gitignore` 中
   - 使用 GitHub Secrets 存储敏感配置

2. **使用 HTTPS**
   - 配置 Nginx 反向代理和 SSL 证书
   - 使用 Let's Encrypt 免费证书

3. **定期更新**
   - 定期更新基础镜像
   - 扫描镜像漏洞

4. **访问控制**
   - 限制容器网络访问
   - 使用防火墙规则

## 📝 下一步

1. ✅ 配置 GitHub Secrets
2. ✅ 创建环境变量文件
3. ✅ 设置部署服务器（如果需要）
4. ✅ 配置域名和 SSL（生产环境）

## ❓ 常见问题

### Q: 镜像构建失败怎么办？

A: 
- 检查 GitHub Actions 日志
- 确认 Dockerfile 语法正确
- 检查依赖是否完整

### Q: 部署后无法访问？

A:
- 检查容器是否运行: `docker ps`
- 检查端口是否正确映射
- 查看容器日志: `docker logs hskswap`
- 检查防火墙设置

### Q: 如何更新应用？

A:
- 推送新代码到 main 分支
- 等待 CI/CD 自动构建
- 手动触发部署或等待自动部署

## 📚 相关文档

- [DOCKER_BUILD.md](./DOCKER_BUILD.md) - Docker 构建详细说明
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 文档](https://docs.docker.com/)

## 🆘 获取帮助

如有问题，请：
1. 查看 GitHub Actions 日志
2. 检查容器日志
3. 提交 Issue 到仓库

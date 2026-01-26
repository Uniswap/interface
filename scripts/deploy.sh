#!/bin/bash

# HSKswap Docker 部署脚本
# 用法: ./scripts/deploy.sh [environment] [image_tag]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAME="${DOCKER_IMAGE_NAME:-hashkeychain/hskswap}"
ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-latest}"
CONTAINER_NAME="hskswap"
PORT="${PORT:-3000}"

# 完整镜像名称
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo -e "${GREEN}🚀 开始部署 HSKswap${NC}"
echo -e "${YELLOW}环境: ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}镜像: ${FULL_IMAGE_NAME}${NC}"
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 拉取最新镜像
echo -e "${GREEN}📥 拉取镜像...${NC}"
docker pull "${FULL_IMAGE_NAME}"

# 停止并删除旧容器
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}🛑 停止旧容器...${NC}"
    docker stop "${CONTAINER_NAME}" || true
    docker rm "${CONTAINER_NAME}" || true
fi

# 运行新容器
echo -e "${GREEN}▶️  启动新容器...${NC}"
docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    -p "${PORT}:80" \
    --env-file .env.${ENVIRONMENT} \
    "${FULL_IMAGE_NAME}"

# 等待容器启动
echo -e "${YELLOW}⏳ 等待容器启动...${NC}"
sleep 5

# 健康检查
echo -e "${GREEN}🏥 检查容器健康状态...${NC}"
for i in {1..30}; do
    if docker exec "${CONTAINER_NAME}" wget --quiet --tries=1 --spider http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 容器健康检查通过！${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 容器健康检查失败${NC}"
        docker logs "${CONTAINER_NAME}"
        exit 1
    fi
    sleep 2
done

# 显示容器信息
echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${YELLOW}容器名称: ${CONTAINER_NAME}${NC}"
echo -e "${YELLOW}访问地址: http://localhost:${PORT}${NC}"
echo ""
echo "查看日志: docker logs -f ${CONTAINER_NAME}"
echo "停止容器: docker stop ${CONTAINER_NAME}"

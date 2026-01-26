#!/bin/bash

# HSKswap 回滚脚本
# 用法: ./scripts/rollback.sh [previous_tag]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CONTAINER_NAME="hskswap"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_NAME="${DOCKER_IMAGE_NAME:-hashkeychain/hskswap}"
PREVIOUS_TAG="${1:-previous}"

if [ "$PREVIOUS_TAG" == "previous" ]; then
    echo -e "${YELLOW}⚠️  请指定要回滚的镜像标签${NC}"
    echo "用法: ./scripts/rollback.sh <tag>"
    echo "示例: ./scripts/rollback.sh v1.0.0"
    exit 1
fi

FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${PREVIOUS_TAG}"

echo -e "${YELLOW}🔄 开始回滚到 ${PREVIOUS_TAG}${NC}"

# 检查镜像是否存在
if ! docker image inspect "${FULL_IMAGE_NAME}" > /dev/null 2>&1; then
    echo -e "${YELLOW}📥 镜像不存在，正在拉取...${NC}"
    docker pull "${FULL_IMAGE_NAME}"
fi

# 停止当前容器
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}🛑 停止当前容器...${NC}"
    docker stop "${CONTAINER_NAME}"
fi

# 删除当前容器
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker rm "${CONTAINER_NAME}"
fi

# 使用回滚脚本重新部署
./scripts/deploy.sh staging "${PREVIOUS_TAG}"

echo -e "${GREEN}✅ 回滚完成！${NC}"

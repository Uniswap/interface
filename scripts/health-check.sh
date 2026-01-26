#!/bin/bash

# HSKswap 健康检查脚本
# 用法: ./scripts/health-check.sh

set -e

CONTAINER_NAME="hskswap"
HEALTH_URL="http://localhost/health"
MAX_RETRIES=5
RETRY_INTERVAL=2

echo "🏥 检查容器健康状态..."

# 检查容器是否运行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ 容器未运行"
    exit 1
fi

# 健康检查
for i in $(seq 1 $MAX_RETRIES); do
    if docker exec "${CONTAINER_NAME}" wget --quiet --tries=1 --spider "${HEALTH_URL}" > /dev/null 2>&1; then
        echo "✅ 容器健康检查通过"
        exit 0
    fi
    echo "⏳ 等待中... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

echo "❌ 容器健康检查失败"
docker logs --tail 50 "${CONTAINER_NAME}"
exit 1

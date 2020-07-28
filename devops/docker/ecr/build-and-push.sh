#!/usr/bin/env bash

TAG_NAME="${1:-latest}"

echo "Building image for... uniswap-exchange"

$(dirname $0)/../build.sh $PROJECT_NAME

ECR_TAG=$(cat ./devops/docker/ecr/uniswap-exchange.json | jq -r '.repository | .repositoryUri'):$TAG_NAME

echo "Tagging and pushing to... $ECR_TAG"

docker tag roll-uniswap-exchange $ECR_TAG

docker push $ECR_TAG

PROJECT_ROOT = $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
CURRENT_BRANCH = $(shell ${PROJECT_ROOT}/devops/scripts/get-current-branch.sh)
CLUSTER_NAME = $(shell ${PROJECT_ROOT}/devops/scripts/get-cluster-name.sh)
K8S_IMAGE_TAG = $(shell ${PROJECT_ROOT}/devops/scripts/get-image-tag.sh)
IMAGE_REPO = 996458161782.dkr.ecr.us-east-1.amazonaws.com
unexport KUBECONFIG

_docker-ecr-login:
	$(shell aws ecr get-login --no-include-email)

create-ecr-repository:
	aws ecr create-repository --repository-name uniswap-exchange | tee ./devops/docker/ecr/uniswap-exchange.json

delete-ecr-repository:
	aws ecr delete-repository --repository-name uniswap-exchange

push-to-ecr-repository: _docker-ecr-login
	./devops/docker/ecr/build-and-push.sh ${K8S_IMAGE_TAG}

k8s-update-tags:
	sed -i "s,latest,${K8S_IMAGE_TAG},g" ${PROJECT_ROOT}/devops/k8s/*.yaml || gsed -i "s,latest,${K8S_IMAGE_TAG},g" ${PROJECT_ROOT}/devops/k8s/*.yaml

k8s-eks-apply: k8s-update-tags
	kubectl apply -f devops/k8s/uniswap-exchange.yaml

k8s-eks-delete:
	kubectl delete -f devops/k8s/uniswap-exchange.yaml

k8s-eks-update: k8s-update-tags
	kubectl set image deployment/uniswap-exchange-deployment uniswap-exchange=${IMAGE_REPO}/uniswap-exchange:${K8S_IMAGE_TAG}

select-environment:
	aws eks update-kubeconfig --name ${CLUSTER_NAME}
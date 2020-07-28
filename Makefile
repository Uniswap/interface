CURRENT_BRANCH = $(shell ${PROJECT_ROOT}/devops/scripts/get-current-branch.sh)

build-image:
	./devops/docker/build.sh

kind-load-image:
	kind load docker-image --nodes "kind-worker,kind-worker2,kind-control-plane" roll-uniswap-exchange

k8s-apply:
	gsed 's,996458161782.dkr.ecr.us-east-1.amazonaws.com/,roll-,g' devops/k8s/uniswap-exchange.yaml | kubectl apply -f -

k8s-delete:
	kubectl delete -f devops/k8s/uniswap-exchange.yaml

k8s-forward-uniswap-exchange:
	kubectl port-forward svc/uniswap-exchange 8000:80

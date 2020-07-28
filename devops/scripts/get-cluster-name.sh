#!/usr/bin/env bash

if [ ! -z "$CLUSTER_NAME" ]; then
  echo $CLUSTER_NAME
  exit 0
fi

# Please see corresponding workspace to env mapping in devops/cloud/terraform/aws/variables.tf
GIT_BRANCH_DEVELOP="dev"
GIT_BRANCH_MASTER="prod"
GIT_BRANCH_SANDBOX="sandbox"
GIT_BRANCH_STAGING="staging"

DEFAULT_CLUSTER_NAME=$GIT_BRANCH_DEVELOP

CURRENT_BRANCH=`$(dirname $0)/get-current-branch.sh`

POSSIBLE_WORKSPACE_NAME=GIT_BRANCH_${CURRENT_BRANCH^^}
echo roll-web-${!POSSIBLE_WORKSPACE_NAME:-$DEFAULT_CLUSTER_NAME}-cluster

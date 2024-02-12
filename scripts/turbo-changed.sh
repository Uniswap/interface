#!/bin/bash

command=$1
# remove first argument so we pass along options to turbo
shift
# Validate command input
if [[ ! $command =~ ^(lint|test|typecheck)$ ]]; then
    echo "Invalid command: $command. Must be one of: lint, test, typecheck."
    exit 1
fi

export NODE_OPTIONS="--max_old_space_size=8192"

# When a GitHub Actions workflow checks out a repository, it does so in a detached HEAD state and merges the PR with the target branch.
# To filter for all changes from this PR in turbo, we check all changes in the branch against the target branch.
# HEAD = the merge commit of this PR into the target branch
# HEAD^1 = last commit on the target branch (typically main)

echo "Is CI mode? $CI"

if [ "$CI" == "true" ]; then
  turbo run $command --log-prefix=none --concurrency=100% --filter="...[HEAD^1]" -- "$@"
  exit $?
fi

# If not on CI, run the turbo command with the provided or detected branch and any extra flags 
# e.g. if you want to run dry mode locally, run `./scripts/turbo.sh lint $(git branch --show-current) --dry`
cur_branch=$(git branch --show-current)
branch=${1:-$cur_branch}

# Check if the branch name is provided
if [[ -z "$branch" || $branch == -* ]]; then
    echo "Error: Branch name is required."
    exit 1
fi

# Shift branch argument, so $@ contains only the extra flags
shift

turbo run $command --concurrency=100% --filter="...[main...$branch]" -- "$@"


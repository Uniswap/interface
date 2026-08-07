#!/bin/bash
# Computes the nx-affected CI decision for the orchestrator's `affected` job.
# Reads MODE from env; writes RUN_ALL + PROJECTS to $GITHUB_OUTPUT.
# Fails open: any indeterminate state runs all checks.

run_all() {
  echo "$1"
  {
    echo "RUN_ALL=true"
    echo "PROJECTS=[]"
  } >> "$GITHUB_OUTPUT"
}

if [[ "${MODE:-}" != "affected" ]]; then
  run_all "✅ - Running all checks"
  exit 0
fi

# PR runs check out the synthetic merge commit GitHub creates between
# the PR head and its target branch, so the first parent is exactly
# the base the PR will merge into — the same base nx-set-shas derives
# from a full-history `git merge-base origin/<base> HEAD`.
# Fail open: if the checkout isn't that merge commit, run everything.
# evaluate_affected_gate/action.yml derives the same base for its `paths`
# check — the two must agree on the diff they inspect; keep them in sync.
if git rev-parse --verify --quiet HEAD^2 > /dev/null; then
  BASE_SHA=$(git rev-parse HEAD^1)
else
  run_all "⚠️ - Could not determine the PR merge base, running all checks"
  exit 0
fi

# Per-app deploy workflows that cannot change what any check does: each one
# only checks out, installs, builds its app/image and ships it (plus Slack
# notifications). None runs a repo test/lint/typecheck, and none declares
# `on: workflow_call`, so ci.yml cannot invoke them.
#
# This is an EXCLUSION list on purpose. Anything under .github/ that is not
# listed here — a new deploy workflow, a renamed one, a composite action, a
# CI script, ci-checks.json — still forces all checks. Forgetting to add a
# path here only costs CI time; getting the polarity backwards would silently
# skip checks. Every entry is currently named `*_deploy.yml`, but the glob is
# deliberately not used as the rule: a future `*_deploy.yml` that runs tests
# must fail into run-all, not out of it.
DEPLOY_ONLY_GITHUB_PATHS=(
  '.github/workflows/dev_portal_production_deploy.yml'
  '.github/workflows/dev_portal_staging_deploy.yml'
  '.github/workflows/mission_control_production_deploy.yml'
  '.github/workflows/mission_control_staging_deploy.yml'
  '.github/workflows/rh_cca_production_deploy.yml'
  '.github/workflows/rh_cca_staging_deploy.yml'
  '.github/workflows/web_ecs_staging_deploy.yml'
  '.github/workflows/web_preview_deploy.yml'
  '.github/workflows/web_production_deploy.yml'
  '.github/workflows/web_staging_deploy.yml'
)

# .github/** (workflows, actions, CI scripts) is invisible to nx
# affected — no namedInput covers those paths — so CI-config
# changes must run all checks, unless every changed .github/ path is
# deploy-only. --no-renames and quotePath=false match the gate action's
# diff (quotePath would wrap non-ASCII paths in quotes, escaping the
# ^.github/ match below). Fail open: an unreadable diff must run everything.
if ! CHANGED_PATHS=$(git -c core.quotePath=false diff --name-only --no-renames "$BASE_SHA" HEAD); then
  run_all "⚠️ - could not diff against the merge base, running all checks"
  exit 0
fi
GITHUB_PATHS=$(grep '^\.github/' <<< "$CHANGED_PATHS" || true)
if [[ -n "$GITHUB_PATHS" ]]; then
  DEPLOY_ONLY=()
  FORCES_RUN_ALL=()
  while IFS= read -r path; do
    is_deploy_only=false
    for deploy_path in "${DEPLOY_ONLY_GITHUB_PATHS[@]}"; do
      if [[ "$path" == "$deploy_path" ]]; then
        is_deploy_only=true
        break
      fi
    done
    if [[ "$is_deploy_only" == true ]]; then
      DEPLOY_ONLY+=("$path")
    else
      FORCES_RUN_ALL+=("$path")
    fi
  done <<< "$GITHUB_PATHS"

  if [[ ${#DEPLOY_ONLY[@]} -gt 0 ]]; then
    echo "🚀 - deploy-only .github/** changes, not forcing all checks:"
    printf '     %s\n' "${DEPLOY_ONLY[@]}"
  fi
  if [[ ${#FORCES_RUN_ALL[@]} -gt 0 ]]; then
    echo "⚙️ - .github/** changes that can alter CI behaviour:"
    printf '     %s\n' "${FORCES_RUN_ALL[@]}"
    run_all "✅ - .github/** changes detected, running all checks"
    exit 0
  fi
fi

# Fail open: a broken affected computation must run everything, not
# silently skip it.
if ! AFFECTED=$(bun nx show projects --affected --base="$BASE_SHA" --head=HEAD); then
  run_all "⚠️ - nx affected computation failed, running all checks"
  exit 0
fi
PROJECTS=$(echo "$AFFECTED" | jq --raw-input --slurp --compact-output 'split("\n") | map(select(length > 0))')

echo "Affected projects: $PROJECTS"
{
  echo "RUN_ALL=false"
  echo "PROJECTS=$PROJECTS"
} >> "$GITHUB_OUTPUT"

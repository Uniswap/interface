#!/bin/sh
# Blocks manual commits of protected env files.
#
# - Raw `.env` files must never be committed. They may carry secrets and drift from the
#   config service. They are also gitignored, so this only triggers on a forced `git add -f`.
# - The checked-in `apps/*/.env.dev` dev-config defaults are updated ONLY by the automated
#   config-sync CI job. Edit configs via Mission Control, never by hand.
#
# CI does not run local git hooks, so the sync job is unaffected. To bypass this,
# use `SKIP_ENV_FILE_CHECK=1` or `git commit --no-verify`

# Allow opting out via env var (matches other hook scripts).
if [ "$SKIP_ENV_FILE_CHECK" = "1" ]; then
  exit 0
fi

RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

# Staged paths, including deletions (D) so .env.dev can't be removed by hand either.
staged=$(git diff --cached --name-only --diff-filter=ACMRD)

blocked=""
oldifs=$IFS
IFS='
'
for file in $staged; do
  base=${file##*/}
  case "$base" in
    .env | .env.dev)
      blocked="${blocked}  - ${file}\n"
      ;;
  esac
done
IFS=$oldifs

if [ -n "$blocked" ]; then
  printf "\n${RED}${BOLD}Commit blocked: protected env file(s) staged${RESET}\n\n" >&2
  printf "${blocked}\n" >&2
  printf "  .env files must never be committed, and apps/*/.env.dev defaults are managed\n" >&2
  printf "  only by the automated config-sync CI job (edit configs via Mission Control).\n\n" >&2
  printf "  Unstage: ${BOLD}git restore --staged <file>${RESET}\n" >&2
  printf "  Suppress (discouraged): ${BOLD}SKIP_ENV_FILE_CHECK=1${RESET} or ${BOLD}git commit --no-verify${RESET}\n\n" >&2
  exit 1
fi

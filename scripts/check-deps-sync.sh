#!/bin/sh
# Fast check that node_modules is in sync with bun.lock.
# Prefixed to g:* scripts in package.json so the warning prints
# directly to the terminal before Nx starts.

# Allow opting out via env var
if [ "$SKIP_DEPS_CHECK" = "1" ]; then
  exit 0
fi

LOCKFILE="$( cd "$(dirname "$0")/.." && pwd )/bun.lock"
MARKER="$( cd "$(dirname "$0")/.." && pwd )/node_modules/.install-marker"

RED='\033[0;31m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

warn() {
  printf '\n' >&2
  printf "${RED}╔══════════════════════════════════════════════════════════════════╗${RESET}\n" >&2
  printf "${RED}║${RESET}  ${YELLOW}${BOLD}node_modules may be out of sync with bun.lock${RESET}                 ${RED}║${RESET}\n" >&2
  printf "${RED}║${RESET}                                                                  ${RED}║${RESET}\n" >&2
  printf "${RED}║${RESET}  Fix: ${BOLD}bun install${RESET}                                                ${RED}║${RESET}\n" >&2
  printf "${RED}║${RESET}  Suppress: ${BOLD}SKIP_DEPS_CHECK=1${RESET}                                     ${RED}║${RESET}\n" >&2
  if [ "$1" = "missing-marker" ]; then
    printf "${RED}║${RESET}                                                                  ${RED}║${RESET}\n" >&2
    printf "${RED}║${RESET}  Note: postinstall scripts may not have run.                     ${RED}║${RESET}\n" >&2
    printf "${RED}║${RESET}  Ensure you're not using ${BOLD}--ignore-scripts${RESET}.                      ${RED}║${RESET}\n" >&2
  fi
  printf "${RED}╚══════════════════════════════════════════════════════════════════╝${RESET}\n" >&2
  printf '\n' >&2
}

if [ ! -d "$(dirname "$MARKER")" ]; then
  warn missing-marker
  exit 0
fi

if [ ! -f "$MARKER" ]; then
  warn missing-marker
  exit 0
fi

if [ "$LOCKFILE" -nt "$MARKER" ]; then
  warn stale-marker
  exit 0
fi

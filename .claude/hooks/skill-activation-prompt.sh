#!/bin/bash
# Copied from https://github.com/diet103/claude-code-infrastructure-showcase/blob/c586f9d8854989abbe9040cde61527888ded3904/.claude/hooks/skill-activation-prompt.sh
set -e

cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
cat | bun run skill-activation-prompt.ts

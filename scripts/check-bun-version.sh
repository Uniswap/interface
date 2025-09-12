#!/bin/bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in Vercel environment
IS_VERCEL=${VERCEL:-0}

# Get the expected bun version from .bun-version file
if [ ! -f ".bun-version" ]; then
    if [ "$IS_VERCEL" = "1" ]; then
        echo -e "${YELLOW}Warning: .bun-version file not found (Vercel environment)${NC}"
        exit 0
    else
        echo -e "${RED}Error: .bun-version file not found${NC}"
        exit 1
    fi
fi

EXPECTED_VERSION=$(cat .bun-version | tr -d '\n' | tr -d '\r')

# Get the current bun version
if ! command -v bun &> /dev/null; then
    if [ "$IS_VERCEL" = "1" ]; then
        echo -e "${YELLOW}Warning: bun is not installed or not in PATH (Vercel environment)${NC}"
        echo -e "${YELLOW}Expected version: ${EXPECTED_VERSION}${NC}"
        exit 0
    else
        echo -e "${RED}Error: bun is not installed or not in PATH${NC}"
        echo -e "${YELLOW}Please install bun version ${EXPECTED_VERSION}${NC}"
        exit 1
    fi
fi

CURRENT_VERSION=$(bun -v | tr -d '\n' | tr -d '\r')

# Compare versions
if [ "$CURRENT_VERSION" != "$EXPECTED_VERSION" ]; then
    if [ "$IS_VERCEL" = "1" ]; then
        echo -e "${YELLOW}Warning: bun version mismatch (Vercel environment)${NC}"
        echo -e "Expected: ${GREEN}${EXPECTED_VERSION}${NC}"
        echo -e "Current:  ${YELLOW}${CURRENT_VERSION}${NC}"
        echo -e "${YELLOW}Version mismatch ignored in Vercel environment${NC}"
        exit 0
    else
        echo -e "${RED}Error: bun version mismatch${NC}"
        echo -e "Expected: ${GREEN}${EXPECTED_VERSION}${NC}"
        echo -e "Current:  ${RED}${CURRENT_VERSION}${NC}"
        echo ""
        echo -e "${YELLOW}Please update bun to version ${EXPECTED_VERSION}:${NC}"
        echo -e "  ${YELLOW}bun upgrade --canary # if you need canary${NC}"
        echo -e "  ${YELLOW}bun upgrade # for stable releases${NC}"
        echo ""
        echo -e "${YELLOW}Or install the specific version:${NC}"
        echo -e "  ${YELLOW}curl -fsSL https://bun.sh/install | bash -s \"bun-v${EXPECTED_VERSION}\"${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ bun version ${CURRENT_VERSION} matches expected version${NC}"

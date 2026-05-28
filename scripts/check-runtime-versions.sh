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

# Track if any errors occurred
HAS_ERROR=0

# ============================================
# Check Bun Version
# ============================================

echo "Checking bun version..."

# Get the expected bun version from .bun-version file
if [ ! -f ".bun-version" ]; then
    if [ "$IS_VERCEL" = "1" ]; then
        echo -e "${YELLOW}Warning: .bun-version file not found (Vercel environment)${NC}"
    else
        echo -e "${RED}Error: .bun-version file not found${NC}"
        HAS_ERROR=1
    fi
else
    EXPECTED_BUN_VERSION=$(cat .bun-version | tr -d '\n' | tr -d '\r')

    # Get the current bun version
    if ! command -v bun &> /dev/null; then
        if [ "$IS_VERCEL" = "1" ]; then
            echo -e "${YELLOW}Warning: bun is not installed or not in PATH (Vercel environment)${NC}"
            echo -e "${YELLOW}Expected version: ${EXPECTED_BUN_VERSION}${NC}"
        else
            echo -e "${RED}Error: bun is not installed or not in PATH${NC}"
            echo -e "${YELLOW}Please install bun version ${EXPECTED_BUN_VERSION}${NC}"
            HAS_ERROR=1
        fi
    else
        CURRENT_BUN_VERSION=$(bun -v | tr -d '\n' | tr -d '\r')

        # Compare versions
        if [ "$CURRENT_BUN_VERSION" != "$EXPECTED_BUN_VERSION" ]; then
            if [ "$IS_VERCEL" = "1" ]; then
                echo -e "${YELLOW}Warning: bun version mismatch (Vercel environment)${NC}"
                echo -e "Expected: ${GREEN}${EXPECTED_BUN_VERSION}${NC}"
                echo -e "Current:  ${YELLOW}${CURRENT_BUN_VERSION}${NC}"
                echo -e "${YELLOW}Version mismatch ignored in Vercel environment${NC}"
            else
                echo -e "${RED}Error: bun version mismatch${NC}"
                echo -e "Expected: ${GREEN}${EXPECTED_BUN_VERSION}${NC}"
                echo -e "Current:  ${RED}${CURRENT_BUN_VERSION}${NC}"
                echo ""
                echo -e "${YELLOW}Please update bun to version ${EXPECTED_BUN_VERSION}:${NC}"
                echo -e "  ${YELLOW}bun upgrade --canary # if you need canary${NC}"
                echo -e "  ${YELLOW}bun upgrade # for stable releases${NC}"
                echo ""
                echo -e "${YELLOW}Or install the specific version:${NC}"
                echo -e "  ${YELLOW}curl -fsSL https://bun.sh/install | bash -s \"bun-v${EXPECTED_BUN_VERSION}\"${NC}"
                HAS_ERROR=1
            fi
        else
            echo -e "${GREEN}✓ bun version ${CURRENT_BUN_VERSION} matches expected version${NC}"
        fi
    fi
fi

echo ""

# ============================================
# Check Node Version
# ============================================

echo "Checking node version..."

# Get the expected node version from .nvmrc file
if [ ! -f ".nvmrc" ]; then
    if [ "$IS_VERCEL" = "1" ]; then
        echo -e "${YELLOW}Warning: .nvmrc file not found (Vercel environment)${NC}"
    else
        echo -e "${RED}Error: .nvmrc file not found${NC}"
        HAS_ERROR=1
    fi
else
    EXPECTED_NODE_VERSION=$(cat .nvmrc | tr -d '\n' | tr -d '\r')

    # Get the current node version
    if ! command -v node &> /dev/null; then
        if [ "$IS_VERCEL" = "1" ]; then
            echo -e "${YELLOW}Warning: node is not installed or not in PATH (Vercel environment)${NC}"
            echo -e "${YELLOW}Expected version: ${EXPECTED_NODE_VERSION}${NC}"
        else
            echo -e "${RED}Error: node is not installed or not in PATH${NC}"
            echo -e "${YELLOW}Please install node version ${EXPECTED_NODE_VERSION}${NC}"
            HAS_ERROR=1
        fi
    else
        CURRENT_NODE_VERSION=$(node -v | tr -d '\n' | tr -d '\r')

        # Compare versions
        if [ "$CURRENT_NODE_VERSION" != "$EXPECTED_NODE_VERSION" ]; then
            if [ "$IS_VERCEL" = "1" ]; then
                echo -e "${YELLOW}Warning: node version mismatch (Vercel environment)${NC}"
                echo -e "Expected: ${GREEN}${EXPECTED_NODE_VERSION}${NC}"
                echo -e "Current:  ${YELLOW}${CURRENT_NODE_VERSION}${NC}"
                echo -e "${YELLOW}Version mismatch ignored in Vercel environment${NC}"
            else
                echo -e "${RED}Error: node version mismatch${NC}"
                echo -e "Expected: ${GREEN}${EXPECTED_NODE_VERSION}${NC}"
                echo -e "Current:  ${RED}${CURRENT_NODE_VERSION}${NC}"
                echo ""
                echo -e "${YELLOW}Please update node to version ${EXPECTED_NODE_VERSION}:${NC}"
                echo -e "  ${YELLOW}nvm install${NC}"
                echo -e "  ${YELLOW}nvm use${NC}"
                echo ""
                echo -e "${YELLOW}Or if using a different node version manager:${NC}"
                echo -e "  ${YELLOW}n ${EXPECTED_NODE_VERSION}${NC}"
                echo -e "  ${YELLOW}fnm install${NC}"
                echo -e "  ${YELLOW}fnm use${NC}"
                HAS_ERROR=1
            fi
        else
            echo -e "${GREEN}✓ node version ${CURRENT_NODE_VERSION} matches expected version${NC}"
        fi
    fi
fi

# Exit with error if any check failed
if [ "$HAS_ERROR" = "1" ]; then
    echo ""
    echo -e "${RED}Runtime version check failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All runtime versions are correct${NC}"


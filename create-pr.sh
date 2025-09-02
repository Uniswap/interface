#!/bin/bash

echo "🚀 JuiceSwap Rebrand - Pull Request Creator"
echo "=========================================="

# Check if we're on the right branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "feature/juiceswap-rebrand" ]; then
    echo "❌ Not on feature/juiceswap-rebrand branch"
    exit 1
fi

echo "✅ On correct branch: $current_branch"

# Try to push to origin (if you have access)
echo "🔄 Attempting to push to origin..."
if git push -u origin feature/juiceswap-rebrand; then
    echo "✅ Successfully pushed to origin!"
    
    # Create PR link
    echo ""
    echo "🎯 Create Pull Request manually at:"
    echo "https://github.com/JuiceSwapxyz/app/compare/develop...feature/juiceswap-rebrand"
    echo ""
    echo "📋 PR Details:"
    echo "Title: feat: Complete JuiceSwap rebrand implementation"
    echo "Base: develop"
    echo "Body:"
    echo "## Summary"
    echo "- Update brand colors from pink to JuiceSwap orange (#F7911A)"
    echo "- Replace all logos and branding assets with JuiceSwap variants"
    echo "- Update app title, favicon, and meta tags for SEO"
    echo "- Create custom Rich Link Preview with JuiceSwap branding"
    echo "- Update navigation text from 'Uniswap' to 'Juice Swap'"
    echo "- Redirect all uniswap.org links to juiceswap.xyz domains"
    echo "- Update core URL constants for user-facing links"
    echo ""
    echo "## Test plan"
    echo "- [x] Visual verification of branding changes"
    echo "- [x] Logo and favicon updates"
    echo "- [x] SEO meta tag updates"
    echo "- [x] Rich Link Preview generation"
    echo "- [x] URL redirects verification"
    
else
    echo "❌ Push to origin failed (no permissions)"
    echo ""
    echo "📝 Instructions:"
    echo "1. Go to https://github.com/JuiceSwapxyz/app"
    echo "2. Click 'Fork' to create your own fork"
    echo "3. Run: git remote add fork https://github.com/YOUR-USERNAME/app.git"
    echo "4. Run: git push -u fork feature/juiceswap-rebrand"
    echo "5. Go to your fork and create a Pull Request to JuiceSwapxyz/app:develop"
fi

echo ""
echo "🎉 Rebrand implementation complete!"
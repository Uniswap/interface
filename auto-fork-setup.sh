#!/bin/bash

echo "🔧 Auto-Fork Setup for JuiceSwap Rebrand PR"
echo "============================================="

# Get current GitHub user
GITHUB_USER=$(git config --get user.name | tr '[:upper:]' '[:lower:]' | sed 's/ //g')
if [ -z "$GITHUB_USER" ]; then
    echo "❓ What's your GitHub username?"
    read -r GITHUB_USER
fi

echo "👤 GitHub User: $GITHUB_USER"

# Check if remote already exists
if git remote | grep -q "fork"; then
    echo "🔄 Removing existing fork remote..."
    git remote remove fork
fi

# Add fork remote
echo "🔗 Adding fork remote..."
git remote add fork https://github.com/$GITHUB_USER/app.git

# Try to push to fork
echo "🚀 Attempting to push to your fork..."
if git push -u fork feature/juiceswap-rebrand; then
    echo "✅ Successfully pushed to fork!"
    
    # Open PR creation page
    echo "🌐 Opening Pull Request creation page..."
    open "https://github.com/$GITHUB_USER/app/compare/feature/juiceswap-rebrand...JuiceSwapxyz:app:develop"
    
    echo ""
    echo "🎯 Pull Request Details (copy-paste ready):"
    echo "=========================================="
    echo "Title: feat: Complete JuiceSwap rebrand implementation"
    echo ""
    echo "Description:"
    echo "## Summary"
    echo "Complete rebrand from Uniswap to JuiceSwap with comprehensive UI and branding updates."
    echo ""
    echo "## Changes"
    echo "- 🎨 Update brand colors from pink to JuiceSwap orange (#F7911A)"
    echo "- 🖼️ Replace all logos and branding assets with JuiceSwap variants"
    echo "- 📱 Update app title, favicon, and meta tags for SEO"
    echo "- 🔗 Create custom Rich Link Preview with JuiceSwap branding"
    echo "- 📝 Update navigation text from 'Uniswap' to 'Juice Swap'"
    echo "- 🌐 Redirect all uniswap.org links to juiceswap.xyz domains"
    echo "- ⚙️ Update core URL constants for user-facing links"
    echo ""
    echo "## Files Modified"
    echo "- Theme colors (packages/ui/src/theme/color/colors.ts)"
    echo "- Logo components and assets"
    echo "- SEO meta tags and page titles"
    echo "- URL constants (packages/uniswap/src/constants/urls.ts)"
    echo "- Navigation components"
    echo "- Privacy policy and legal links"
    echo ""
    echo "## Test Plan"
    echo "- [x] Visual verification of branding changes"
    echo "- [x] Logo and favicon updates working"
    echo "- [x] SEO meta tags updated correctly"
    echo "- [x] Rich Link Preview generated"
    echo "- [x] URL redirects functional"
    echo "- [x] Navigation text updated"
    echo ""
    echo "Ready for review! 🎉"
    
else
    echo "❌ Push failed. Make sure you have:"
    echo "1. Forked the repository at: https://github.com/JuiceSwapxyz/app"
    echo "2. Your fork exists at: https://github.com/$GITHUB_USER/app"
    echo ""
    echo "If fork doesn't exist, I'll open the page for you to create it:"
    open "https://github.com/JuiceSwapxyz/app/fork"
    echo "After forking, run this script again!"
fi
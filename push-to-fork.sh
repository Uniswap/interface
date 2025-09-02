#!/bin/bash

echo "🔧 JuiceSwap Rebrand - Push to Fork"
echo "==================================="

# Common GitHub usernames to try based on the system
POSSIBLE_USERS=("NoahPay" "noah" "n" "dfx-noah" "noah-dfx")

echo "🔍 Trying to find your GitHub fork..."

for user in "${POSSIBLE_USERS[@]}"; do
    echo "🔄 Trying username: $user"
    
    # Remove existing fork remote
    git remote remove fork 2>/dev/null || true
    
    # Add fork remote
    git remote add fork https://github.com/$user/app.git
    
    # Test if remote exists by trying to fetch
    if git ls-remote fork >/dev/null 2>&1; then
        echo "✅ Found your fork: $user/app"
        echo "🚀 Pushing to fork..."
        
        if git push -u fork feature/juiceswap-rebrand; then
            echo "🎉 Successfully pushed!"
            echo ""
            echo "🌐 Opening Pull Request page..."
            open "https://github.com/$user/app/pull/new/feature/juiceswap-rebrand"
            
            echo ""
            echo "📋 PR Details (ready to copy-paste):"
            echo "===================================="
            echo "Title: feat: Complete JuiceSwap rebrand implementation"
            echo ""
            echo "Body:"
            cat << 'EOF'
## Summary
Complete rebrand from Uniswap to JuiceSwap with comprehensive UI and branding updates.

## Changes Made
- 🎨 Update brand colors from pink to JuiceSwap orange (#F7911A)
- 🖼️ Replace all logos and branding assets with JuiceSwap variants
- 📱 Update app title, favicon, and meta tags for SEO
- 🔗 Create custom Rich Link Preview with JuiceSwap branding
- 📝 Update navigation text from "Uniswap" to "Juice Swap"
- 🌐 Redirect all uniswap.org links to juiceswap.xyz domains
- ⚙️ Update core URL constants for user-facing links

## Files Modified
- Theme colors (`packages/ui/src/theme/color/colors.ts`)
- Logo components and assets
- SEO meta tags and page titles
- URL constants (`packages/uniswap/src/constants/urls.ts`)
- Navigation components
- Privacy policy and legal links

## Testing
- [x] Visual verification of branding changes
- [x] Logo and favicon updates working
- [x] SEO meta tags updated correctly
- [x] Rich Link Preview generated and tested
- [x] URL redirects functional
- [x] Navigation text updated throughout interface

Ready for review! 🎯
EOF
            
            echo ""
            echo "🎉 All done! Your Pull Request is ready to be created."
            exit 0
        else
            echo "❌ Push failed for user: $user"
        fi
    else
        echo "❌ Fork not found for user: $user"
    fi
done

echo ""
echo "❌ Could not find your fork. Please check:"
echo "1. Your fork URL: https://github.com/YOUR-USERNAME/app"
echo "2. Make sure the fork was created successfully"
echo ""
echo "Manual steps:"
echo "git remote add fork https://github.com/YOUR-ACTUAL-USERNAME/app.git"
echo "git push -u fork feature/juiceswap-rebrand"
#!/bin/bash

# Create a PNG from our HTML preview
echo "Creating PNG from HTML preview..."

# Open the HTML in Chrome headless mode if available
if command -v /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome >/dev/null 2>&1; then
    echo "Using Chrome to capture screenshot..."
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --headless \
        --disable-gpu \
        --window-size=1200,630 \
        --screenshot="apps/web/public/images/1200x630_Rich_Link_Preview_Image.png" \
        "file:///Users/n/Documents/GitHub/JuiceSwapxyz/app/apps/web/public/images/juiceswap-preview.html"
    echo "Screenshot saved!"
elif command -v screencapture >/dev/null 2>&1; then
    echo "Chrome not found, please manually screenshot the HTML file and save as:"
    echo "apps/web/public/images/1200x630_Rich_Link_Preview_Image.png"
    echo "The HTML file is at: apps/web/public/images/juiceswap-preview.html"
fi
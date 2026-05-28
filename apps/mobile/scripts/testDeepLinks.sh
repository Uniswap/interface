#!/bin/bash

# This script tests deep links for the Uniswap mobile app locally.
# Usage: ./testDeepLinks.sh <user_id>

# It opens a series of URLs in the iOS simulator and terminates the app after each URL is opened.
# Arguments:
#   user_id: The user ID to be included in some of the URLs.

bundle_id="com.uniswap.mobile.dev"

if [ -z "$1" ]; then
  echo "Usage: $0 <user_id>"
  exit 1
fi

user_id="$1"

urls=(
  "uniswap://wc?uri=wc:af098@2?relay-protocol=irn&symKey=51e"
  "uniswap://wc:af098@2?relay-protocol=irn&symKey=51e"
  "uniswap://scantastic?param=value"
  "uniswap://uwulink?param=value"
  "uniswap://redirect?screen=transaction&fiatOffRamp=true&userAddress=$user_id&externalTransactionId=123"
  "https://uniswap.org/app?screen=swap&userAddress=$user_id&inputCurrencyId=1-0x6B175474E89094C44Da98b954EedeAC495271d0F&outputCurrencyId=1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&currencyField=input&amount=100"
  "https://uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=$user_id"
  "https://uniswap.org/app?screen=transaction&userAddress=$user_id"
  "https://uniswap.org/app/wc?uri=wc:af098@2?relay-protocol=irn&symKey=51e"
  "uniswap://app/fiatonramp?userAddress=$user_id&source=push"
  "uniswap://app/tokendetails?currencyId=10-0x6fd9d7ad17242c41f7131d257212c54a0e816691&source=push"
  "uniswap://app/tokendetails?currencyId=0-fwefe&source=push" # invalid currencyId
)

xcrun simctl terminate booted "$bundle_id"

for url in "${urls[@]}"; do
  echo "Opening URL: $url"
  xcrun simctl openurl booted "$url"
  sleep 10
  echo "Terminating app with bundle ID: $bundle_id"
  xcrun simctl terminate booted "$bundle_id"
done

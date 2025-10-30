# Analytics Setup for Taiko Uniswap Interface

## Current Status

Analytics is **DISABLED** by default because the Uniswap Amplitude proxy (`https://api.uniswap.org/v1/amplitude-proxy`) requires authentication that only works from Uniswap's official domain.

## Why Analytics Fails

The Uniswap proxy returns:
```
HTTP 409 Conflict
x-amzn-errortype: ForbiddenException
```

This is because:
1. The proxy validates the request origin/referer headers
2. Only requests from `app.uniswap.org` or authorized domains are accepted
3. Your custom Taiko deployment domain is not authorized

## Option 1: Keep Analytics Disabled (Current Setup)

**Status**: ✅ Implemented

Analytics is gracefully disabled with no errors:
- `.env` has `REACT_APP_AMPLITUDE_PROXY_URL` commented out
- `src/tracing/index.ts` only initializes analytics if proxy URL is set
- No console errors or network failures
- All functionality works perfectly without analytics

**No action needed** - this is production-ready.

## Option 2: Enable Analytics with Your Own Amplitude Account

If you want to track user behavior for your Taiko deployment:

### Step 1: Create Amplitude Account

1. Go to https://amplitude.com
2. Create free account (10M events/month free tier)
3. Create new project for "Taiko Uniswap Interface"
4. Get your API key from Settings

### Step 2: Choose Integration Method

**Method A: Direct API Key (Simple)**

Update `.env`:
```bash
# Remove proxy URL, use direct API key
REACT_APP_AMPLITUDE_API_KEY="your-amplitude-api-key-here"
```

Update `src/tracing/index.ts`:
```typescript
// Replace the conditional block with:
const amplitudeKey = process.env.REACT_APP_AMPLITUDE_API_KEY || AMPLITUDE_DUMMY_KEY
const useProxy = !!process.env.REACT_APP_AMPLITUDE_PROXY_URL

if (amplitudeKey !== AMPLITUDE_DUMMY_KEY || useProxy) {
  initializeAnalytics(amplitudeKey, OriginApplication.INTERFACE, {
    proxyUrl: process.env.REACT_APP_AMPLITUDE_PROXY_URL, // undefined for direct
    defaultEventName: SharedEventName.PAGE_VIEWED,
    commitHash: process.env.REACT_APP_GIT_COMMIT_HASH,
    isProductionEnv: isProductionEnv(),
    debug: isDevelopmentEnv(),
  })
}
```

**Method B: Set Up Your Own Proxy (Advanced)**

If you want to hide your Amplitude API key from client-side code:

1. Deploy a simple proxy server (Cloudflare Workers, Vercel Edge, AWS Lambda)
2. Proxy forwards requests to Amplitude with your API key
3. Set `REACT_APP_AMPLITUDE_PROXY_URL` to your proxy URL

Example Cloudflare Worker:
```javascript
export default {
  async fetch(request) {
    const amplitudeKey = 'YOUR_KEY_HERE'
    const body = await request.json()

    return fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: amplitudeKey,
        events: body.events
      })
    })
  }
}
```

### Step 3: Test Analytics

1. Restart dev server
2. Open browser console
3. Check for: `[Analytics] Disabled - no REACT_APP_AMPLITUDE_PROXY_URL configured` should be gone
4. Perform actions (swap, connect wallet, etc.)
5. Check Amplitude dashboard for events

## Option 3: Alternative Analytics Solutions

Instead of Amplitude, you could use:

- **PostHog**: Open-source, self-hostable
- **Plausible**: Privacy-focused, GDPR compliant
- **Mixpanel**: Similar to Amplitude
- **Google Analytics 4**: Free, widely used

All require modifying `src/tracing/index.ts` and `src/analytics/index.tsx` to integrate their SDKs.

## Recommendation

For **Taiko testnet deployment**: Keep analytics disabled (current setup)

For **Taiko mainnet production**:
1. Set up Amplitude free account
2. Use Method A (direct API key) for simplicity
3. Monitor user behavior to improve UX
4. Upgrade to paid plan if you exceed 10M events/month

## Files Modified

- `.env` - Disabled `REACT_APP_AMPLITUDE_PROXY_URL`
- `src/tracing/index.ts` - Conditional analytics initialization
- This document - Setup instructions

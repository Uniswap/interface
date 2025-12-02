<!-- 6b751d87-406c-4913-967b-37f41a99f00d ea80e977-b766-4cf8-a84c-0d75e22fbd08 -->
# Unify Token Detail Data Sources

## Overview

Standardize data fetching across mobile and web token detail pages to prefer CoinGecko (TokenProjectMarket) over subgraph (TokenMarket) data, ensuring consistency while maintaining platform-specific features.

## Data Source Strategy

**CoinGecko (TokenProjectMarket) provides:**

- price, marketCap, fullyDilutedValuation (FDV)
- pricePercentChange (24hr) - **MUST be unified across mobile & web**
- priceHighLow (52w high/low)
- priceHistory (for line charts)

**Subgraph (TokenMarket) provides (exclusive):**

- volume (24hr/1day - same data, different display names)
- totalValueLocked (TVL) - web only display, but available in hook
- ohlc (for candlestick charts)

**Preference order:** CoinGecko first, fallback to subgraph

**Critical:** Work with existing GraphQL queries - no changes to .graphql files

## Implementation Steps

### 1. Create Shared Data Hooks

Create `packages/uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData.ts` with hooks that implement the CoinGecko-first strategy:

```typescript
// useTokenSpotPrice: returns price from CoinGecko ?? subgraph
// useTokenMarketStats: returns { marketCap, fdv, volume, tvl, high52w, low52w }
// useTokenPriceChange: returns 24hr price change from CoinGecko ?? subgraph
```

These hooks should:

- Accept currencyId or token/project data directly
- Return unified data with clear fallback logic
- Be usable by both web and mobile
- Use existing GraphQL queries (no .graphql file changes)

**Important data unification:**
- **24hr percent change**: Mobile & web MUST show same value (CoinGecko preferred)
- **Volume**: Mobile displays "24hr volume", web displays "1 day volume" - same data, display names can differ
- **FDV**: Mobile displays "Fully diluted valuation", web displays "FDV" - same data, display names can differ
- **TVL**: Only displayed on web, but should be available in hook for consistency

### 2. Update Mobile Stats

**File:** `apps/mobile/src/components/TokenDetails/TokenDetailsStats.tsx`

Currently uses subgraph-only for volume. Update to use shared hooks:

- Use `useTokenMarketStats` for all stats (marketCap, fdv, volume, 52w high/low)
- Use `useTokenPriceChange` for 24hr percent change (unified with web)
- Volume (labeled "24hr volume") will still come from subgraph (not available in CoinGecko)
- FDV (labeled "Fully diluted valuation") will prefer CoinGecko
- Verify 52w high/low prefers CoinGecko

### 3. Update Web Stats

**File:** `apps/web/src/components/Tokens/TokenDetails/StatsSection.tsx`

Currently uses subgraph-only for TVL and volume. Update to use shared logic:

- Use `useTokenPriceChange` for 24hr percent change (unified with mobile)
- TVL must use subgraph (not available in CoinGecko)
- Volume (labeled "1 day volume") must use subgraph (not available in CoinGecko)
- FDV (labeled "FDV") will prefer CoinGecko
- Verify marketCap prefers CoinGecko (already correct)

### 4. Update Mobile Price Charts

**File:** `apps/mobile/src/components/PriceExplorer/usePriceHistory.ts`

Currently correctly prefers CoinGecko for priceHistory. Verify this matches the standardized approach and document the strategy clearly.

### 5. Update Web Price Charts

**File:** `apps/web/src/components/Tokens/TokenDetails/ChartSection/hooks.ts`

Currently uses subgraph-only. Update to:

- For line charts: prefer CoinGecko priceHistory, fallback to subgraph
- For candlestick charts: must use subgraph ohlc (not available in CoinGecko)
- Ensure current price uses CoinGecko

### 6. Verify Token Name Usage

Both platforms should use `token.name` (not `project.name`):

- Mobile: `apps/mobile/src/components/TokenDetails/TokenDetailsHeader.tsx` - verify uses `token.name`
- Web: `apps/web/src/components/Tokens/TokenDetails/TokenDetailsHeader.tsx` - verify uses `currency.name` (which derives from `token.name`)

## Testing Checklist

- [ ] Mobile & web show **identical** 24hr percent change values
- [ ] Mobile stats show same underlying data as web for shared fields (marketCap, FDV, volume)
- [ ] Web stats show TVL correctly (subgraph only)
- [ ] Mobile shows 52w high/low correctly (CoinGecko preferred)
- [ ] Price charts use CoinGecko data when available
- [ ] Candlestick charts on web still work (must use subgraph)
- [ ] Fallback to subgraph works when CoinGecko unavailable
- [ ] Token names display consistently on both platforms
- [ ] Volume values match between "24hr volume" (mobile) and "1 day volume" (web)
- [ ] FDV values match between "Fully diluted valuation" (mobile) and "FDV" (web)

## Notes

- Volume and TVL are ONLY available in subgraph (TokenMarket), not CoinGecko
- Candlestick OHLC data is ONLY available in subgraph
- Keep platform-specific chart implementations separate (mobile doesn't support candlesticks)
- **DO NOT modify any .graphql files** - work with existing queries
- Display names can differ between platforms for UX reasons, but underlying data must be unified
- 24hr price change data source preference is now documented and consistent: CoinGecko first, fallback to subgraph


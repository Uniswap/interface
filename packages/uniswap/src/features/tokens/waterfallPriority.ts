import { Currency } from '@uniswap/sdk-core'
import { getStablecoinsForChain, isUniverseChainId } from 'uniswap/src/features/chains/utils'

// Tier 0 (preferred quote): stablecoin → Tier 1: ETH/native → Tier 2: BTC → Tier 3: other
export enum TokenTier {
  Stablecoin = 0,
  Native = 1,
  BTC = 2,
  Other = 3,
}

const BTC_SYMBOLS = new Set(['BTC', 'WBTC', 'BTCB', 'TBTC', 'CBBTC'])

/** Returns the waterfall priority tier for a currency. Lower tier = preferred quote asset. */
export function getTokenTier(currency: Currency): TokenTier {
  if (isUniverseChainId(currency.chainId) && getStablecoinsForChain(currency.chainId).some((s) => s.equals(currency))) {
    return TokenTier.Stablecoin
  }
  if (currency.isNative) {
    return TokenTier.Native
  }
  if (BTC_SYMBOLS.has(currency.symbol?.toUpperCase() ?? '')) {
    return TokenTier.BTC
  }
  return TokenTier.Other
}

/**
 * Returns true when tokenA should be the quote asset (and tokenB the base), based on waterfall
 * priority: Stablecoin > Native > BTC > Other.
 *
 * Use this to determine the canonical display direction for a trading pair.
 *
 * | tokenA         | tokenB         | tierA | tierB | result   | displayed as  |
 * |----------------|----------------|-------|-------|----------|---------------|
 * | USDC (stable)  | ETH (native)   |   0   |   1   | reversed | ETH / USDC    |
 * | ETH (native)   | UNI (other)    |   1   |   3   | reversed | UNI / ETH     |
 * | UNI (other)    | USDC (stable)  |   3   |   0   | default  | UNI / USDC    |
 * | WBTC (BTC)     | ETH (native)   |   2   |   1   | default  | WBTC / ETH    |
 */
export function shouldReverseForWaterfall(tokenA: Currency, tokenB: Currency): boolean {
  return getTokenTier(tokenA) < getTokenTier(tokenB)
}

import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import type { MarginMarketKey, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import {
  DEFAULT_MARGIN_PAIR_KEY,
  marginMarketKey,
  USDC,
  USDT,
  WETH,
  type MarginAsset,
  type MarginMarket,
  type MarginTokenInfo,
} from '~/constants/margin'

// Test-only market catalog. Production resolves markets from /margin/markets (see
// useMarginMarkets) — nothing here is read outside test files.

const CBBTC: MarginTokenInfo = {
  address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  symbol: 'cbBTC',
  decimals: 8,
}
const WSTETH: MarginTokenInfo = {
  address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  symbol: 'wstETH',
  decimals: 18,
}
const WEETH: MarginTokenInfo = {
  address: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
  symbol: 'weETH',
  decimals: 18,
}
const RETH: MarginTokenInfo = {
  address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
  symbol: 'rETH',
  decimals: 18,
}
const XAUT: MarginTokenInfo = {
  address: '0x68749665FF8D2d112Fa859AA293F07A622782F38',
  symbol: 'XAUt',
  decimals: 6,
}
const WBTC: MarginTokenInfo = {
  address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  symbol: 'WBTC',
  decimals: 8,
}
const TBTC: MarginTokenInfo = {
  address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
  symbol: 'tBTC',
  decimals: 18,
}

// Derives each pair's composite key from the asset's collateral and per-pair debt.
function buildAsset(input: {
  asset: string
  name: string
  displaySymbol: string
  collateral: MarginTokenInfo
  shouldUseNativeEquity: boolean
  pairs: Array<{
    debt: MarginTokenInfo
    lltvWad: string
    // Server-authored on the wire; the fixtures carry one for the same reason the wire does — the
    // slider ceiling has no other source.
    maxLeverage: number
    borrowRateBps?: number
    venue?: MarginVenue
  }>
}): MarginAsset {
  return {
    asset: input.asset,
    name: input.name,
    displaySymbol: input.displaySymbol,
    collateral: input.collateral,
    shouldUseNativeEquity: input.shouldUseNativeEquity,
    pairs: input.pairs.map((pair) => {
      // Fixture-local default; the registry itself never invents a venue.
      const venue = pair.venue ?? 'MORPHO'
      return {
        key: marginMarketKey({ collateralToken: input.collateral.address, debtToken: pair.debt.address, venue }),
        debt: pair.debt,
        venue,
        lltvWad: pair.lltvWad,
        maxLeverage: pair.maxLeverage,
        borrowRateBps: pair.borrowRateBps,
      }
    }),
  }
}

export const MARGIN_ASSETS: MarginAsset[] = [
  buildAsset({
    asset: 'ETH',
    name: 'Ethereum',
    displaySymbol: 'ETH',
    collateral: WETH,
    shouldUseNativeEquity: true,
    pairs: [
      {
        debt: USDC,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 420,
      },
    ],
  }),
  buildAsset({
    asset: 'BTC',
    name: 'Coinbase Wrapped BTC',
    displaySymbol: 'cbBTC',
    collateral: CBBTC,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 380,
      },
      {
        debt: USDT,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 410,
      },
    ],
  }),
  buildAsset({
    asset: 'stETH',
    name: 'Wrapped Lido Staked ETH',
    displaySymbol: 'wstETH',
    collateral: WSTETH,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 350,
      },
      {
        debt: USDT,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 370,
      },
    ],
  }),
  buildAsset({
    asset: 'weETH',
    name: 'ether.fi Staked ETH',
    displaySymbol: 'weETH',
    collateral: WEETH,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '770000000000000000',
        maxLeverage: 3,
        borrowRateBps: 460,
      },
    ],
  }),
  buildAsset({
    asset: 'rETH',
    name: 'Rocket Pool ETH',
    displaySymbol: 'rETH',
    collateral: RETH,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 360,
      },
    ],
  }),
  buildAsset({
    asset: 'Gold',
    name: 'Tether Gold',
    displaySymbol: 'XAUt',
    collateral: XAUT,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDT,
        lltvWad: '770000000000000000',
        maxLeverage: 3,
        borrowRateBps: 240,
      },
    ],
  }),
  buildAsset({
    asset: 'WBTC',
    name: 'Wrapped BTC',
    displaySymbol: 'WBTC',
    collateral: WBTC,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 400,
      },
      {
        debt: USDT,
        lltvWad: '860000000000000000',
        maxLeverage: 5,
        borrowRateBps: 410,
      },
    ],
  }),
  buildAsset({
    asset: 'tBTC',
    name: 'tBTC',
    displaySymbol: 'tBTC',
    collateral: TBTC,
    shouldUseNativeEquity: false,
    pairs: [
      {
        debt: USDC,
        lltvWad: '770000000000000000',
        maxLeverage: 3,
        borrowRateBps: 440,
      },
    ],
  }),
]

// Flattened by pair.key so lookups by composite marketKey stay O(1).
export const MARGIN_MARKETS: Record<string, MarginMarket> = Object.fromEntries(
  MARGIN_ASSETS.flatMap((asset) =>
    asset.pairs.map((pair): [string, MarginMarket] => [
      pair.key,
      {
        key: pair.key,
        asset: asset.asset,
        name: asset.name,
        displaySymbol: asset.displaySymbol,
        collateral: asset.collateral,
        debt: pair.debt,
        venue: pair.venue,
        lltvWad: pair.lltvWad,
        maxLeverage: pair.maxLeverage,
        shouldUseNativeEquity: asset.shouldUseNativeEquity,
      },
    ]),
  ),
)

export function getMarginMarket(key: MarginMarketKey): MarginMarket | undefined {
  return MARGIN_MARKETS[key]
}

// The WETH/USDC Morpho fixture that most component/hook tests build off of.
export function getDefaultMarginMarket(): MarginMarket {
  const market = Object.values(MARGIN_MARKETS).find(
    (entry) =>
      entry.venue === 'MORPHO' &&
      marginPairKey({ collateralToken: entry.collateral.address, debtToken: entry.debt.address }) ===
        DEFAULT_MARGIN_PAIR_KEY,
  )
  if (!market) {
    throw new Error('Default margin market missing from fixture catalog')
  }
  return market
}

export function getMarginAssets(): MarginAsset[] {
  return MARGIN_ASSETS
}

// Maps a (collateral, debt, venue) tuple back to its fixture market, independent of any
// marketKey string a caller might otherwise construct by hand.
export function findMarginMarketByTokens({
  collateralToken,
  debtToken,
  venue = 'MORPHO',
}: {
  collateralToken: string
  debtToken: string
  venue?: MarginVenue
}): MarginMarket | undefined {
  return MARGIN_MARKETS[marginMarketKey({ collateralToken, debtToken, venue })]
}

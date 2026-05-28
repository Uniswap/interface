import type { PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

const DEFAULT_MULTICHAIN_OWNER_SUFFIX = '0xuser'

const defaultMultichainTokens: PortfolioChainBalance[] = [
  {
    chainId: 1,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
    quantity: 1,
    valueUsd: 100,
    isHidden: false,
    currencyInfo: {
      currencyId: '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      currency: {
        chainId: 1,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        isToken: true,
      } as PortfolioMultichainBalance['tokens'][0]['currencyInfo']['currency'],
      logoUrl: undefined,
    },
  },
]

/**
 * Test helper for a single chain row inside {@link PortfolioMultichainBalance.tokens}.
 * For protobuf {@link ChainBalance} used with {@link MultichainBalance}, see
 * `toPortfolioMultichainBalance.test.ts` (different shape).
 */
export function createPortfolioChainBalance(overrides: Partial<PortfolioChainBalance> = {}): PortfolioChainBalance {
  return {
    chainId: 1,
    address: '0x1111111111111111111111111111111111111111',
    decimals: 18,
    quantity: 1,
    valueUsd: 10,
    isHidden: false,
    currencyInfo: {
      currencyId: '1-0x1111111111111111111111111111111111111111',
      currency: {
        chainId: 1,
        address: '0x1111111111111111111111111111111111111111',
        isToken: true,
        symbol: 'T',
        name: 'Zebra',
        isNative: false,
      } as PortfolioChainBalance['currencyInfo']['currency'],
      logoUrl: undefined,
    },
    ...overrides,
  }
}

export type CreatePortfolioMultichainBalanceOptions = {
  /** Default `0xuser`; web portfolio table tests use `0xowner`. */
  cacheOwnerSuffix?: string
}

/**
 * Test helper for {@link PortfolioMultichainBalance} (sorted portfolio / token list hooks).
 * When `id` is omitted, uses the first token's `currencyId` (falls back to `mc-1` if there are no tokens).
 */
export function createPortfolioMultichainBalance(
  overrides: Partial<PortfolioMultichainBalance> = {},
  options?: CreatePortfolioMultichainBalanceOptions,
): PortfolioMultichainBalance {
  const ownerSuffix = options?.cacheOwnerSuffix ?? DEFAULT_MULTICHAIN_OWNER_SUFFIX
  const hasTokensKey = Object.prototype.hasOwnProperty.call(overrides, 'tokens')
  const tokens = hasTokensKey ? overrides.tokens! : defaultMultichainTokens
  const id = overrides.id ?? tokens[0]?.currencyInfo.currencyId ?? 'mc-1'
  const cacheId = overrides.cacheId ?? `TokenBalance:${id}-${ownerSuffix}`

  return {
    name: 'USD Coin',
    symbol: 'USDC',
    logoUrl: null,
    totalAmount: 1,
    priceUsd: 10,
    pricePercentChange1d: null,
    totalValueUsd: 100,
    isHidden: false,
    ...overrides,
    id,
    cacheId,
    tokens,
  } as PortfolioMultichainBalance
}

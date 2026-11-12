import {
  Amount,
  Balance,
  SafetyLevel,
  SpamCode,
  Token,
  TokenMetadata,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useTokenSectionsForSearchResults } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForSearchResults'
import { convertRestBalanceToPortfolioBalance } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { renderHook } from 'uniswap/src/test/test-utils'

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'

/** A v1 GetPortfolio legacy balance, as the backend serves it. */
function portfolioBalance({
  address,
  symbol,
  name,
  categoryIds,
}: {
  address: string
  symbol: string
  name: string
  categoryIds?: string[]
}): PortfolioBalance {
  const balance = new Balance({
    token: new Token({
      chainId: UniverseChainId.Mainnet,
      address,
      decimals: 6,
      symbol,
      name,
      metadata: new TokenMetadata({
        safetyLevel: SafetyLevel.VERIFIED,
        spamCode: SpamCode.NOT_SPAM,
        categoryIds,
      }),
    }),
    amount: new Amount({ amount: 100, raw: '100000000' }),
    valueUsd: 100,
  })
  const converted = convertRestBalanceToPortfolioBalance(balance, '0xowner')
  if (!converted) {
    throw new Error('fixture balance did not convert')
  }
  return converted
}

const mocks = vi.hoisted(() => ({
  balancesById: {} as Record<string, PortfolioBalance>,
  useMultichainSearchTokens: vi.fn(),
}))

const idle = { error: undefined, refetch: vi.fn(), isLoading: false }

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: (): boolean => true,
}))
vi.mock('uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById', () => ({
  usePortfolioBalancesForAddressById: () => ({ ...idle, data: mocks.balancesById }),
}))
vi.mock('uniswap/src/features/bridging/hooks/tokens', () => ({
  useBridgingTokensOptions: () => ({ ...idle, data: undefined }),
}))
vi.mock('uniswap/src/features/dataApi/searchTokens', () => ({
  useMultichainSearchTokens: mocks.useMultichainSearchTokens,
}))

const baseParams: Parameters<typeof useTokenSectionsForSearchResults>[0] = {
  addresses: { evmAddress: '0x82D56A352367453f74FC0dC7B071b311da373Fa6' },
  chainFilter: null,
  chainIds: [UniverseChainId.Mainnet],
  searchFilter: 'usd',
  isBalancesOnlySearch: true,
}

describe('useTokenSectionsForSearchResults', () => {
  beforeEach(() => {
    const usdc = portfolioBalance({
      address: USDC_ADDRESS,
      symbol: 'USDC',
      name: 'USD Coin',
      categoryIds: ['stablecoins', 'majors'],
    })
    const usdt = portfolioBalance({ address: USDT_ADDRESS, symbol: 'USDT', name: 'Tether USD' })
    mocks.balancesById = {
      [usdc.currencyInfo.currencyId]: usdc,
      [usdt.currencyInfo.currencyId]: usdt,
    }
    mocks.useMultichainSearchTokens.mockReset()
    mocks.useMultichainSearchTokens.mockReturnValue({ ...idle, data: undefined })
  })

  it("serves a balances-only search from the portfolio, keeping each balance's own categories", () => {
    const { result } = renderHook(() => useTokenSectionsForSearchResults(baseParams))

    const rows = result.current.data?.flatMap((section) => section.data)
    expect(rows?.map((row) => [row.currencyInfo.currency.symbol, row.currencyInfo.categoryIds])).toEqual(
      expect.arrayContaining([
        ['USDC', ['stablecoins', 'majors']],
        ['USDT', []],
      ]),
    )
    expect(rows).toHaveLength(2)
    expect(mocks.useMultichainSearchTokens).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
  })

  it('filters balances by the search text without dropping categories', () => {
    const { result } = renderHook(() => useTokenSectionsForSearchResults({ ...baseParams, searchFilter: 'usdc' }))

    const rows = result.current.data?.flatMap((section) => section.data)
    expect(rows?.map((row) => row.currencyInfo.categoryIds)).toEqual([['stablecoins', 'majors']])
  })
})

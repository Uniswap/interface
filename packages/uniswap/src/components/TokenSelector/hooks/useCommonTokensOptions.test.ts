import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

// Create mock functions before vi.mock runs
const { mockUseAllCommonBaseCurrencies, mockUseCurrencyInfosWithLoading } = vi.hoisted(() => ({
  mockUseAllCommonBaseCurrencies: vi.fn(),
  mockUseCurrencyInfosWithLoading: vi.fn(),
}))

vi.mock('uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies', () => ({
  useAllCommonBaseCurrencies: mockUseAllCommonBaseCurrencies,
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfosWithLoading: mockUseCurrencyInfosWithLoading,
}))

// --- Test data helpers ---

function makeCurrencyInfo({ token }: { token: Token }): CurrencyInfo {
  return {
    currencyId: buildCurrencyId(token.chainId, token.address),
    currency: token,
    logoUrl: null,
    safetyInfo: {
      tokenList: TokenList.Default,
      protectionResult: GraphQLApi.ProtectionResult.Benign,
      blockaidFees: { buyFeePercent: 0, sellFeePercent: 0 },
    },
  }
}

// Common base currencies (normally returned by useAllCommonBaseCurrencies)
const mainnetToken1 = new Token(
  UniverseChainId.Mainnet,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD Coin',
)
const mainnetToken2 = new Token(UniverseChainId.Mainnet, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai')
const arbitrumToken = new Token(
  UniverseChainId.ArbitrumOne,
  '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  6,
  'USDC',
  'USD Coin',
)

// Tokens that should be filtered OUT of common base results
const lineaCommonToken = new Token(
  UniverseChainId.Linea,
  '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
  6,
  'USDC',
  'USD Coin',
)
const xLayerCommonToken = new Token(
  UniverseChainId.XLayer,
  '0x74b7F16337b8972027F6196A17a631aC6dE26d22',
  6,
  'USDC',
  'USD Coin',
)
const baseCommonToken = new Token(
  UniverseChainId.Base,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  6,
  'USDC',
  'USD Coin',
)
const megaEthCommonToken = new Token(
  UniverseChainId.MegaETH,
  '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7',
  18,
  'USDM',
  'USDM',
)
const unichainUsdtToken = new Token(
  UniverseChainId.Unichain,
  '0x588ce4f028d8e7b53b687865d6a67b3a54c75518',
  6,
  'USDT',
  'Tether USD',
)

const mainnetCurrencyInfo1 = makeCurrencyInfo({ token: mainnetToken1 })
const mainnetCurrencyInfo2 = makeCurrencyInfo({ token: mainnetToken2 })
const arbitrumCurrencyInfo = makeCurrencyInfo({ token: arbitrumToken })
const lineaCommonCurrencyInfo = makeCurrencyInfo({ token: lineaCommonToken })
const xLayerCommonCurrencyInfo = makeCurrencyInfo({ token: xLayerCommonToken })
const baseCommonCurrencyInfo = makeCurrencyInfo({ token: baseCommonToken })
const megaEthCommonCurrencyInfo = makeCurrencyInfo({ token: megaEthCommonToken })
const unichainUsdtCurrencyInfo = makeCurrencyInfo({ token: unichainUsdtToken })

const allCommonBaseCurrencies = [
  mainnetCurrencyInfo1,
  mainnetCurrencyInfo2,
  arbitrumCurrencyInfo,
  lineaCommonCurrencyInfo,
  xLayerCommonCurrencyInfo,
  baseCommonCurrencyInfo,
  megaEthCommonCurrencyInfo,
  unichainUsdtCurrencyInfo,
]

// Linea-specific quick-select currencies
const lineaUsdcToken = new Token(
  UniverseChainId.Linea,
  '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
  6,
  'USDC',
  'USD Coin',
)
const lineaUsdtToken = new Token(
  UniverseChainId.Linea,
  '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
  6,
  'USDT',
  'Tether USD',
)
const lineaWbtcToken = new Token(
  UniverseChainId.Linea,
  '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4',
  8,
  'WBTC',
  'Wrapped BTC',
)

const lineaCurrencies = [
  makeCurrencyInfo({ token: lineaUsdcToken }),
  makeCurrencyInfo({ token: lineaUsdtToken }),
  makeCurrencyInfo({ token: lineaWbtcToken }),
]

// XLayer-specific quick-select currencies
const xLayerUsdtToken = new Token(
  UniverseChainId.XLayer,
  '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
  6,
  'USDT0',
  'USDT0',
)
const xLayerUsdgToken = new Token(
  UniverseChainId.XLayer,
  '0x4ae46a509F6b1D9056937BA4500cb143933D2dc8',
  6,
  'USDG',
  'USDG',
)

const xLayerCurrencies = [makeCurrencyInfo({ token: xLayerUsdtToken }), makeCurrencyInfo({ token: xLayerUsdgToken })]

// Base-specific quick-select currencies
const baseUsdcToken = new Token(
  UniverseChainId.Base,
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  6,
  'USDC',
  'USD Coin',
)
const baseUsdtToken = new Token(
  UniverseChainId.Base,
  '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
  6,
  'USDT',
  'Tether USD',
)
const baseCbBtcToken = new Token(
  UniverseChainId.Base,
  '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
  8,
  'cbBTC',
  'Coinbase Wrapped BTC',
)

const baseCurrencies = [
  makeCurrencyInfo({ token: baseUsdcToken }),
  makeCurrencyInfo({ token: baseUsdtToken }),
  makeCurrencyInfo({ token: baseCbBtcToken }),
]

// MegaETH-specific quick-select currencies
const megaEthUsdmToken = new Token(
  UniverseChainId.MegaETH,
  '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7',
  18,
  'USDM',
  'USDM',
)
const megaEthUsdeToken = new Token(
  UniverseChainId.MegaETH,
  '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
  18,
  'USDe',
  'USDe',
)
const megaEthBtcBToken = new Token(
  UniverseChainId.MegaETH,
  '0xB0F70C0bD6FD87dbEb7C10dC692a2a6106817072',
  8,
  'BTC.b',
  'Bitcoin Avalanche Bridged',
)

const megaEthCurrencies = [
  makeCurrencyInfo({ token: megaEthUsdmToken }),
  makeCurrencyInfo({ token: megaEthUsdeToken }),
  makeCurrencyInfo({ token: megaEthBtcBToken }),
]

// --- Mock helpers ---

const defaultGqlResult = {
  error: undefined,
  loading: false,
  refetch: vi.fn(),
}

const skippedResult = { data: undefined, ...defaultGqlResult }

function makePortfolioData({
  portfolioError,
  portfolioLoading = false,
}: { portfolioError?: Error; portfolioLoading?: boolean } = {}): {
  data: Record<string, never> | undefined
  error: Error | undefined
  loading: boolean
  refetch: ReturnType<typeof vi.fn>
} {
  return {
    data: portfolioError ? undefined : {},
    error: portfolioError,
    loading: portfolioLoading,
    refetch: vi.fn(),
  }
}

function setupDefaultMocks({
  chainFilter,
  commonBase,
  commonBaseError,
  commonBaseLoading = false,
  lineaData = lineaCurrencies,
  lineaError,
  lineaLoading = false,
  xLayerData = xLayerCurrencies,
  xLayerError,
  xLayerLoading = false,
  baseData = baseCurrencies,
  baseError,
  baseLoading = false,
  megaEthData = megaEthCurrencies,
  megaEthError,
  megaEthLoading = false,
}: {
  chainFilter: UniverseChainId | null
  commonBase?: CurrencyInfo[] | null
  commonBaseError?: Error
  commonBaseLoading?: boolean
  lineaData?: CurrencyInfo[]
  lineaError?: Error
  lineaLoading?: boolean
  xLayerData?: CurrencyInfo[]
  xLayerError?: Error
  xLayerLoading?: boolean
  baseData?: CurrencyInfo[]
  baseError?: Error
  baseLoading?: boolean
  megaEthData?: CurrencyInfo[]
  megaEthError?: Error
  megaEthLoading?: boolean
}): void {
  mockUseAllCommonBaseCurrencies.mockReturnValue({
    data: commonBase === null ? undefined : (commonBase ?? allCommonBaseCurrencies),
    error: commonBaseError,
    loading: commonBaseLoading,
    refetch: vi.fn(),
  })

  // useCurrencyInfosWithLoading is called four times: first for XLayer, then for Linea, then for Base, then for MegaETH.
  // Each call receives { skip: true } when the chain doesn't match.
  mockUseCurrencyInfosWithLoading
    .mockReturnValueOnce(
      chainFilter === UniverseChainId.XLayer
        ? { data: xLayerData, error: xLayerError, loading: xLayerLoading, refetch: vi.fn() }
        : { ...skippedResult, loading: xLayerLoading },
    )
    .mockReturnValueOnce(
      chainFilter === UniverseChainId.Linea
        ? { data: lineaData, error: lineaError, loading: lineaLoading, refetch: vi.fn() }
        : { ...skippedResult, loading: lineaLoading },
    )
    .mockReturnValueOnce(
      chainFilter === UniverseChainId.Base
        ? { data: baseData, error: baseError, loading: baseLoading, refetch: vi.fn() }
        : { ...skippedResult, loading: baseLoading },
    )
    .mockReturnValueOnce(
      chainFilter === UniverseChainId.MegaETH
        ? { data: megaEthData, error: megaEthError, loading: megaEthLoading, refetch: vi.fn() }
        : { ...skippedResult, loading: megaEthLoading },
    )
}

// --- Import the hook under test AFTER mocks are set up ---
// (Dynamic import isn't needed since vi.mock hoists automatically)
import { useCommonTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptions'

describe(useCommonTokensOptions, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('chain-specific quick-select routing', () => {
    it('returns Linea-specific tokens when chainFilter is Linea', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return Linea currencies, not common base
      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Linea, lineaUsdcToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Linea, lineaUsdtToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Linea, lineaWbtcToken.address))
      expect(result.current.data).toHaveLength(lineaCurrencies.length)
    })

    it('returns MegaETH-specific tokens when chainFilter is MegaETH', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.MegaETH })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.MegaETH,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return MegaETH currencies, not common base
      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.MegaETH, megaEthUsdmToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.MegaETH, megaEthUsdeToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.MegaETH, megaEthBtcBToken.address))
      expect(result.current.data).toHaveLength(megaEthCurrencies.length)
    })

    it('returns XLayer-specific tokens when chainFilter is XLayer', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.XLayer })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.XLayer,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.XLayer, xLayerUsdtToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.XLayer, xLayerUsdgToken.address))
      expect(result.current.data).toHaveLength(xLayerCurrencies.length)
    })

    it('returns Base-specific tokens when chainFilter is Base', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Base })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Base,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Base, baseUsdcToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Base, baseUsdtToken.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Base, baseCbBtcToken.address))
      expect(result.current.data).toHaveLength(baseCurrencies.length)
    })

    it('returns common base tokens filtered to Mainnet when chainFilter is Mainnet', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Mainnet })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Mainnet,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should return only Mainnet tokens from common base (not Linea, MegaETH, XLayer, or Unichain)
      const chainIds = result.current.data?.map((opt) => opt.currencyInfo.currency.chainId) ?? []
      expect(chainIds.every((id) => id === UniverseChainId.Mainnet)).toBe(true)
      expect(result.current.data).toHaveLength(2) // mainnetToken1 and mainnetToken2
    })
  })

  describe('filtering from common base', () => {
    it('excludes USDT on Unichain from common base', async () => {
      setupDefaultMocks({ chainFilter: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).not.toContain(buildCurrencyId(UniverseChainId.Unichain, unichainUsdtToken.address))
    })

    it('keeps non-excluded tokens from common base when no chain filter', async () => {
      setupDefaultMocks({ chainFilter: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should keep Mainnet and Arbitrum tokens
      const currencyIds = result.current.data?.map((opt) => opt.currencyInfo.currencyId) ?? []
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Mainnet, mainnetToken1.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.Mainnet, mainnetToken2.address))
      expect(currencyIds).toContain(buildCurrencyId(UniverseChainId.ArbitrumOne, arbitrumToken.address))
    })
  })

  describe('empty and undefined states', () => {
    it('returns undefined data when common base currencies are undefined', async () => {
      setupDefaultMocks({ chainFilter: null, commonBase: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBeUndefined()
    })

    it('returns empty array when Linea currencies are empty', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea, lineaData: [] })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual([])
    })

    it('returns empty array when MegaETH currencies are empty', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.MegaETH, megaEthData: [] })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.MegaETH,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('error handling', () => {
    it('returns portfolio error when portfolio fetch fails', async () => {
      const portfolioError = new Error('Portfolio fetch failed')
      setupDefaultMocks({ chainFilter: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData({ portfolioError }),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('returns error when common base currencies fetch fails', async () => {
      const commonBaseError = new Error('Common base fetch failed')
      setupDefaultMocks({ chainFilter: null, commonBase: null, commonBaseError })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('returns error when Linea currencies fetch fails and chainFilter is Linea', async () => {
      const lineaError = new Error('Linea fetch failed')
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea, lineaData: [], lineaError })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })

    it('returns error when MegaETH currencies fetch fails and chainFilter is MegaETH', async () => {
      const megaEthError = new Error('MegaETH fetch failed')
      setupDefaultMocks({ chainFilter: UniverseChainId.MegaETH, megaEthData: [], megaEthError })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.MegaETH,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('loading state', () => {
    it('is loading when common base currencies are loading', async () => {
      setupDefaultMocks({ chainFilter: null, commonBaseLoading: true })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      expect(result.current.loading).toBe(true)
    })

    it('is loading when portfolio is loading', async () => {
      setupDefaultMocks({ chainFilter: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData({ portfolioLoading: true }),
          chainFilter: null,
        }),
      )

      expect(result.current.loading).toBe(true)
    })

    it('is loading when Linea currencies are loading', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea, lineaLoading: true })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      expect(result.current.loading).toBe(true)
    })

    it('is loading when MegaETH currencies are loading', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.MegaETH, megaEthLoading: true })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.MegaETH,
        }),
      )

      expect(result.current.loading).toBe(true)
    })

    it('is loading when XLayer currencies are loading', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.XLayer, xLayerLoading: true })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.XLayer,
        }),
      )

      expect(result.current.loading).toBe(true)
    })

    it('is loading when Base currencies are loading', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Base, baseLoading: true })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Base,
        }),
      )

      expect(result.current.loading).toBe(true)
    })
  })

  describe('token option structure', () => {
    it('returns TokenOptions with correct type', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      result.current.data?.forEach((option) => {
        expect(option.type).toBe(OnchainItemListOptionType.Token)
        expect(option.currencyInfo).toBeDefined()
        expect(option.currencyInfo.currency).toBeDefined()
      })
    })

    it('returns empty balance options when no portfolio balances exist', async () => {
      setupDefaultMocks({ chainFilter: UniverseChainId.Linea })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: UniverseChainId.Linea,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // With empty portfolioBalancesById, all options should have null balances
      result.current.data?.forEach((option) => {
        expect(option.balanceUSD).toBeNull()
        expect(option.quantity).toBeNull()
      })
    })
  })

  describe('refetch', () => {
    it('provides a refetch function', async () => {
      setupDefaultMocks({ chainFilter: null })

      const { result } = renderHook(() =>
        useCommonTokensOptions({
          portfolioData: makePortfolioData(),
          chainFilter: null,
        }),
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.refetch).toBeDefined()
      expect(typeof result.current.refetch).toBe('function')
    })
  })
})

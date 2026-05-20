import { FeatureFlags } from '@universe/gating'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  usePortfolioBalancePart,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const {
  mockUseEnabledChains,
  mockUseCurrencyIdToVisibility,
  mockUseGetPortfolioQuery,
  mockUseGetWalletBalancesQuery,
  mockUseHideSmallBalancesSetting,
  mockUseHideSpamTokensSetting,
  mockUsePlatformBasedFetchPolicy,
  mockUseFeatureFlag,
} = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseCurrencyIdToVisibility: vi.fn(),
  mockUseGetPortfolioQuery: vi.fn(),
  mockUseGetWalletBalancesQuery: vi.fn(),
  mockUseHideSmallBalancesSetting: vi.fn(),
  mockUseHideSpamTokensSetting: vi.fn(),
  mockUsePlatformBasedFetchPolicy: vi.fn(),
  mockUseFeatureFlag: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/getPortfolio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/getPortfolio')>()),
  useGetPortfolioQuery: mockUseGetPortfolioQuery,
}))

vi.mock('uniswap/src/data/rest/getWalletBalances/getWalletBalances', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/rest/getWalletBalances/getWalletBalances')>()),
  useGetWalletBalancesQuery: mockUseGetWalletBalancesQuery,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/settings/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/settings/hooks')>()),
  useHideSmallBalancesSetting: mockUseHideSmallBalancesSetting,
  useHideSpamTokensSetting: mockUseHideSpamTokensSetting,
}))

vi.mock('uniswap/src/features/transactions/selectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/transactions/selectors')>()),
  useCurrencyIdToVisibility: mockUseCurrencyIdToVisibility,
}))

vi.mock('uniswap/src/utils/usePlatformBasedFetchPolicy', () => ({
  usePlatformBasedFetchPolicy: mockUsePlatformBasedFetchPolicy,
}))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: mockUseFeatureFlag,
}))

// `useGetPortfolioQuery` and `useGetWalletBalancesQuery` both return shapes compatible with
// `UseQueryResult`. The hook reads `data`/`isFetching`/`status`/`error`/`refetch`/`dataUpdatedAt`,
// so the mocks only need those fields.
const PORTFOLIO_TOTAL_FROM_GET_PORTFOLIO = {
  balanceUSD: 1000,
  percentChange: 2,
  absoluteChangeUSD: 50,
}

const WALLET_BALANCES_BY_PART = {
  total: { balanceUSD: 1300, percentChange: 3, absoluteChangeUSD: 100 },
  tokens: { balanceUSD: 1000, percentChange: 2, absoluteChangeUSD: 50 },
  pools: { balanceUSD: 300, percentChange: 5, absoluteChangeUSD: 50 },
} as const

const makeQueryResult = <T>(
  data: T,
): {
  data: T
  isFetching: boolean
  refetch: ReturnType<typeof vi.fn>
  error: null
  status: 'success'
  dataUpdatedAt: number
} => ({
  data,
  isFetching: false,
  refetch: vi.fn(),
  error: null,
  status: 'success',
  dataUpdatedAt: 1710000000000,
})

describe(usePortfolioBalancePart, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)

    mockUseGetPortfolioQuery.mockReturnValue(makeQueryResult(PORTFOLIO_TOTAL_FROM_GET_PORTFOLIO))

    // The GetWalletBalances mock honours the `select` so the test exercises the real selector
    // routing inside `selectorForPart` end-to-end.
    mockUseGetWalletBalancesQuery.mockImplementation(({ select }) => {
      const rawResponse = {
        balance: {
          total: { valueUsd: 1300, percentChange1d: 3, absoluteChange1d: 100 },
          tokens: { valueUsd: 1000, percentChange1d: 2, absoluteChange1d: 50 },
          pools: { valueUsd: 300, percentChange1d: 5, absoluteChange1d: 50 },
        },
      }
      return makeQueryResult(select ? select(rawResponse) : rawResponse)
    })
  })

  describe('flag off (default)', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it.each([PortfolioBalancePart.Total, PortfolioBalancePart.Tokens, PortfolioBalancePart.Pools])(
      'resolves part="%s" to the GetPortfolio total when the flag is off',
      (part) => {
        const { result } = renderHookWithProviders(() => usePortfolioBalancePart({ part, evmAddress: '0x123' }))

        expect(result.current.data).toEqual(PORTFOLIO_TOTAL_FROM_GET_PORTFOLIO)
      },
    )

    it('only enables the GetPortfolio query when the flag is off', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }))

      expect(mockUseGetPortfolioQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
      expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('returns identical data across all three parts when the flag is off', () => {
      const { result: total } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }),
      )
      const { result: tokens } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }),
      )
      const { result: pools } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Pools, evmAddress: '0x123' }),
      )

      expect(total.current.data).toEqual(tokens.current.data)
      expect(tokens.current.data).toEqual(pools.current.data)
    })
  })

  describe('flag on', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    })

    it.each([PortfolioBalancePart.Total, PortfolioBalancePart.Tokens, PortfolioBalancePart.Pools])(
      'resolves part="%s" to the matching GetWalletBalances part when the flag is on',
      (part) => {
        const { result } = renderHookWithProviders(() => usePortfolioBalancePart({ part, evmAddress: '0x123' }))

        expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART[part])
      },
    )

    it('only enables the GetWalletBalances query when the flag is on', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }))

      expect(mockUseGetWalletBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }))
      expect(mockUseGetPortfolioQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('returns differentiated data across the three parts when the flag is on', () => {
      const { result: total } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }),
      )
      const { result: tokens } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }),
      )
      const { result: pools } = renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Pools, evmAddress: '0x123' }),
      )

      expect(total.current.data?.balanceUSD).toBe(1300)
      expect(tokens.current.data?.balanceUSD).toBe(1000)
      expect(pools.current.data?.balanceUSD).toBe(300)
      expect(total.current.data).not.toEqual(tokens.current.data)
      expect(tokens.current.data).not.toEqual(pools.current.data)
    })

    it('passes the same chain/modifier shape to both queries so cache keys stay consistent', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }))

      const portfolioInput = mockUseGetPortfolioQuery.mock.calls[0]?.[0]?.input
      const walletBalancesInput = mockUseGetWalletBalancesQuery.mock.calls[0]?.[0]?.input

      expect(portfolioInput).toEqual(walletBalancesInput)
    })

    it('re-projects to the new part when part changes on a mounted hook', () => {
      // Model the React Query contract that the consumer hook actually relies on:
      // `select` is only re-invoked when its function reference changes between renders.
      // Stable references re-use the previously projected value (which is the failure mode
      // we are guarding against here).
      const rawResponse = {
        balance: {
          total: { valueUsd: 1300, percentChange1d: 3, absoluteChange1d: 100 },
          tokens: { valueUsd: 1000, percentChange1d: 2, absoluteChange1d: 50 },
          pools: { valueUsd: 300, percentChange1d: 5, absoluteChange1d: 50 },
        },
      }
      let lastSelect: ((data: unknown) => unknown) | undefined
      let lastProjected: unknown
      mockUseGetWalletBalancesQuery.mockImplementation(({ select }) => {
        if (select !== lastSelect) {
          lastSelect = select
          lastProjected = select ? select(rawResponse) : rawResponse
        }
        return makeQueryResult(lastProjected)
      })

      const { result, rerender } = renderHookWithProviders(
        (props: { part: PortfolioBalancePart }) => usePortfolioBalancePart({ part: props.part, evmAddress: '0x123' }),
        { initialProps: [{ part: PortfolioBalancePart.Tokens }] },
      )

      expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART.tokens)

      rerender([{ part: PortfolioBalancePart.Pools }])

      expect(result.current.data).toEqual(WALLET_BALANCES_BY_PART.pools)
    })
  })

  it('passes the network/error/refetch metadata through unchanged when the flag is on', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.PortfolioPoolsBalances)
    mockUseGetWalletBalancesQuery.mockReturnValue({
      data: undefined,
      isFetching: false,
      refetch: vi.fn(),
      error: new Error('Network error'),
      status: 'error',
      dataUpdatedAt: 0,
    })

    const { result } = renderHookWithProviders(() =>
      usePortfolioBalancePart({ part: PortfolioBalancePart.Tokens, evmAddress: '0x123' }),
    )

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toEqual(expect.any(Error))
    expect(result.current.dataUpdatedAt).toBeUndefined()
  })

  describe('query contract preservation', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    const EXPECTED_MAINNET_MODIFIER = {
      address: '0x123',
      includeOverrides: [],
      excludeOverrides: [],
      includeSmallBalances: true,
      includeSpamTokens: true,
    }

    it('forwards evmAddress, svmAddress, default chainIds, and the REST modifier as input', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', svmAddress: 'svm456' }),
      )

      expect(mockUseGetPortfolioQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            evmAddress: '0x123',
            svmAddress: 'svm456',
            chainIds: [UniverseChainId.Mainnet],
            modifier: EXPECTED_MAINNET_MODIFIER,
          },
        }),
      )
    })

    it('uses explicit chainIds when provided and falls back to useEnabledChains otherwise', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({
          part: PortfolioBalancePart.Total,
          evmAddress: '0x123',
          chainIds: [UniverseChainId.Optimism, UniverseChainId.ArbitrumOne],
        }),
      )

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            chainIds: [UniverseChainId.Optimism, UniverseChainId.ArbitrumOne],
          }),
        }),
      )

      mockUseGetPortfolioQuery.mockClear()

      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            chainIds: [UniverseChainId.Mainnet],
          }),
        }),
      )
    })

    it('enables the query when an address is provided and enabled is not explicitly false', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
    })

    it('disables the query when no evm/svm address is provided', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total }))

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('disables the query when enabled: false is passed even with an address', () => {
      renderHookWithProviders(() =>
        usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123', enabled: false }),
      )

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
    })

    it('forwards refetchInterval from usePlatformBasedFetchPolicy', () => {
      mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: 15_000 })

      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      expect(mockUseGetPortfolioQuery).toHaveBeenLastCalledWith(expect.objectContaining({ refetchInterval: 15_000 }))
    })

    it('passes a select callback that returns undefined for an undefined response', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const callArgs = mockUseGetPortfolioQuery.mock.calls.at(-1)?.[0]
      expect(callArgs?.select(undefined)).toBeUndefined()
      expect(callArgs?.select({ portfolio: undefined })).toBeUndefined()
    })

    it('passes a select callback that maps GetPortfolio totals to {balanceUSD, percentChange, absoluteChangeUSD}', () => {
      renderHookWithProviders(() => usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }))

      const callArgs = mockUseGetPortfolioQuery.mock.calls.at(-1)?.[0]
      expect(
        callArgs?.select({
          portfolio: {
            totalValueUsd: 250,
            totalValuePercentChange1d: -3.5,
            totalValueAbsoluteChange1d: -10,
          },
        }),
      ).toEqual({
        balanceUSD: 250,
        percentChange: -3.5,
        absoluteChangeUSD: -10,
      })
    })
  })
})

describe(usePortfolioTotalValue, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
    mockUsePlatformBasedFetchPolicy.mockReturnValue({ pollInterval: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
    mockUseFeatureFlag.mockReturnValue(false)
    mockUseGetPortfolioQuery.mockReturnValue(makeQueryResult(PORTFOLIO_TOTAL_FROM_GET_PORTFOLIO))
    mockUseGetWalletBalancesQuery.mockReturnValue(makeQueryResult(undefined))
  })

  it('returns the same shape as usePortfolioBalancePart({ part: "total" }) (wrapper smoke test)', () => {
    const { result: wrapped } = renderHookWithProviders(() => usePortfolioTotalValue({ evmAddress: '0x123' }))
    const { result: canonical } = renderHookWithProviders(() =>
      usePortfolioBalancePart({ part: PortfolioBalancePart.Total, evmAddress: '0x123' }),
    )

    expect(wrapped.current.data).toEqual(canonical.current.data)
    expect(wrapped.current.loading).toBe(canonical.current.loading)
    expect(wrapped.current.networkStatus).toEqual(canonical.current.networkStatus)
  })
})

import { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { top1DVolumeResultsToTokenOptions, useTop1DVolumeTokens } from 'uniswap/src/features/dataApi/top1DVolumeTokens'
import type { CurrencyInfo, MultichainSearchResult, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const { mockUseEnabledChains, mockListTokens } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockListTokens: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { listTokens: mockListTokens },
}))

function createToken(chainId: UniverseChainId, volume1dUsd?: number, priceUsd?: number): CurrencyInfo {
  return {
    currency: { chainId },
    currencyId: `${chainId}-0xtoken`,
    ...((volume1dUsd !== undefined || priceUsd !== undefined) && { searchStats: { volume1dUsd, priceUsd } }),
  } as unknown as CurrencyInfo
}

function createResult(tokens: CurrencyInfo[]): MultichainSearchResult {
  return { id: 'mc', name: 'Token', symbol: 'TKN', logoUrl: undefined, tokens }
}

function chainIdsOf(options: { currencyInfo: { currency: { chainId: number } } }[]): number[] {
  return options.map((option) => option.currencyInfo.currency.chainId)
}

describe(top1DVolumeResultsToTokenOptions, () => {
  it('picks the token on the filtered chain and drops results without one', () => {
    const results = [
      createResult([createToken(UniverseChainId.Mainnet), createToken(UniverseChainId.ArbitrumOne)]),
      createResult([createToken(UniverseChainId.Base)]),
    ]

    const options = top1DVolumeResultsToTokenOptions(results, { chainFilter: UniverseChainId.ArbitrumOne })

    expect(chainIdsOf(options)).toEqual([UniverseChainId.ArbitrumOne])
  })

  it('picks the highest-1d-volume deployment when no chain is filtered', () => {
    const results = [
      createResult([
        createToken(UniverseChainId.Mainnet, 10),
        createToken(UniverseChainId.ArbitrumOne, 50),
        createToken(UniverseChainId.Base, 20),
      ]),
    ]

    const options = top1DVolumeResultsToTokenOptions(results, { chainFilter: null })

    expect(chainIdsOf(options)).toEqual([UniverseChainId.ArbitrumOne])
  })

  it('restricts the unfiltered pick to the allowed chainIds', () => {
    const results = [
      createResult([createToken(UniverseChainId.Mainnet, 10), createToken(UniverseChainId.ArbitrumOne, 50)]),
      createResult([createToken(UniverseChainId.Base, 5)]),
    ]

    const options = top1DVolumeResultsToTokenOptions(results, {
      chainFilter: null,
      chainIds: [UniverseChainId.Mainnet],
    })

    expect(chainIdsOf(options)).toEqual([UniverseChainId.Mainnet])
  })

  it('falls back to the first eligible deployment when no volume stats are present', () => {
    const results = [createResult([createToken(UniverseChainId.Mainnet), createToken(UniverseChainId.Base)])]

    const options = top1DVolumeResultsToTokenOptions(results, { chainFilter: null })

    expect(chainIdsOf(options)).toEqual([UniverseChainId.Mainnet])
  })

  it('carries market fields and merges a portfolio balance when one is present', () => {
    const mainnet = createToken(UniverseChainId.Mainnet, 10, 1.5)
    const results = [createResult([mainnet, createToken(UniverseChainId.ArbitrumOne)])]
    const balance = { currencyInfo: mainnet, quantity: 3, balanceUSD: 4.5 } as unknown as PortfolioBalance

    const [withBalance] = top1DVolumeResultsToTokenOptions(results, {
      chainFilter: UniverseChainId.Mainnet,
      portfolioBalancesById: { [mainnet.currencyId]: balance },
    })
    const [withoutBalance] = top1DVolumeResultsToTokenOptions(results, { chainFilter: UniverseChainId.Mainnet })

    expect(withBalance).toMatchObject({ quantity: 3, balanceUSD: 4.5, priceUsd: 1.5, networkCount: 2 })
    expect(withoutBalance).toMatchObject({ quantity: null, balanceUSD: null, priceUsd: 1.5, networkCount: 2 })
  })
})

describe(useTop1DVolumeTokens, () => {
  const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const USDC_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  const usdc = createRankedMultichainToken({
    addresses: { [UniverseChainId.Mainnet]: USDC_MAINNET, [UniverseChainId.ArbitrumOne]: USDC_ARBITRUM },
  })

  beforeEach(() => {
    mockListTokens.mockReset()
    mockListTokens.mockResolvedValue(new ListTokensResponse({ multichainTokens: [usdc] }))
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne] })
    SharedQueryClient.clear()
  })

  it('requests every enabled chain when there is no chain filter', async () => {
    const { result } = renderHook(() => useTop1DVolumeTokens({ chainFilter: null }))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toHaveLength(1)
    })
    expect(mockListTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIds: [UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne],
        page: { pageSize: 100 },
        sort: { orderBy: expect.anything(), ascending: false },
      }),
    )
  })

  it('requests only the filtered chain, ignoring chainIds', async () => {
    const { result } = renderHook(() =>
      useTop1DVolumeTokens({
        chainFilter: UniverseChainId.Mainnet,
        chainIds: [UniverseChainId.ArbitrumOne],
        pageSize: 8,
      }),
    )

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
    })
    expect(mockListTokens).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [UniverseChainId.Mainnet], page: { pageSize: 8 } }),
    )
  })

  it('requests chainIds when given without a chain filter', async () => {
    const { result } = renderHook(() =>
      useTop1DVolumeTokens({ chainFilter: null, chainIds: [UniverseChainId.ArbitrumOne] }),
    )

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
    })
    expect(mockListTokens).toHaveBeenCalledWith(expect.objectContaining({ chainIds: [UniverseChainId.ArbitrumOne] }))
  })

  it('does not fetch when skipped', () => {
    const { result } = renderHook(() => useTop1DVolumeTokens({ chainFilter: null, skip: true }))

    expect(result.current.data).toBeUndefined()
    expect(mockListTokens).not.toHaveBeenCalled()
  })
})

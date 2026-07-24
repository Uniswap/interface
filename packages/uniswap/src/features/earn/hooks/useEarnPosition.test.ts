import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import React, { type PropsWithChildren } from 'react'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { useOptimisticEarnPositionStore } from 'uniswap/src/features/earn/optimisticEarnPositions'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfo, getEarnVaultId } from 'uniswap/src/features/earn/utils'

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

const useQueryMock = vi.mocked(useQuery)

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const VAULT_ADDRESS = '0x1111111111111111111111111111111111111111'
const VAULT_ID = getEarnVaultId({
  chainId: UniverseChainId.Mainnet,
  vaultAddress: VAULT_ADDRESS,
})

const VAULT = {
  vaultAddress: VAULT_ADDRESS,
  chainId: UniverseChainId.Mainnet,
  id: VAULT_ID,
}

const DATA_API_VAULT = new DataApiEarnVault({
  address: VAULT_ADDRESS,
  chainId: UniverseChainId.Mainnet,
  name: 'USDC Vault',
  symbol: 'gtUSDC',
  underlyingToken: new Token({
    chainId: UniverseChainId.Mainnet,
    address: USDC_ADDRESS,
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    type: TokenType.ERC20,
  }),
  netApy: 0.05,
})

const DATA_API_POSITION = new DataApiEarnPosition({
  vault: DATA_API_VAULT,
  sharesRaw: '1000000',
  currentAssetsRaw: '100000000',
  currentAssetsUsd: 100,
})

const PREFETCHED_POSITION = getEarnPositionInfo(DATA_API_POSITION)

type QueryState = {
  data?: unknown
  isSuccess?: boolean
  isLoading?: boolean
  isError?: boolean
}

function queryResult({
  data,
  isSuccess = true,
  isLoading = false,
  isError = false,
}: QueryState): ReturnType<typeof useQuery> {
  return {
    data,
    error: null,
    isError,
    isLoading,
    isSuccess,
    isPlaceholderData: false,
  } as unknown as ReturnType<typeof useQuery>
}

// `getEarnPosition` is the live per-vault query; `listEarnPositions` is the cache-only seed read. Each
// branch applies the hook's real `select` so the position-mapping logic is exercised, not mocked away.
function mockQueries({
  livePosition,
  cachedPositions,
}: {
  livePosition?: QueryState
  cachedPositions?: { positions?: DataApiEarnPosition[]; isSuccess?: boolean }
}): void {
  useQueryMock.mockImplementation(
    ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
      switch (queryKey?.[1]) {
        case 'getEarnPosition': {
          const raw = livePosition?.data ? { position: livePosition.data } : undefined
          return queryResult({
            data: select && raw ? select(raw) : undefined,
            isSuccess: livePosition?.isSuccess ?? false,
            isLoading: livePosition?.isLoading ?? false,
            isError: livePosition?.isError ?? false,
          })
        }
        case 'listEarnPositions': {
          const raw = cachedPositions?.positions ? { positions: cachedPositions.positions } : undefined
          return queryResult({
            data: select && raw ? select(raw) : undefined,
            isSuccess: cachedPositions?.isSuccess ?? false,
          })
        }
        default:
          return queryResult({ data: undefined, isSuccess: false })
      }
    },
  )
}

function renderEarnPosition(
  overrides: {
    isConnected?: boolean
    prefetchedPosition?: typeof PREFETCHED_POSITION
  } = {},
) {
  return renderHook(
    () =>
      useEarnPosition({
        vault: VAULT,
        walletAddress: WALLET_ADDRESS,
        isConnected: overrides.isConnected ?? true,
        enabled: true,
        prefetchedPosition: overrides.prefetchedPosition,
      }),
    { wrapper: createWrapper() },
  )
}

function createWrapper(): React.ComponentType<PropsWithChildren> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren): React.ReactElement {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe(useEarnPosition, () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    useOptimisticEarnPositionStore.getState().clearUpdates()
  })

  afterEach(() => {
    useOptimisticEarnPositionStore.getState().clearUpdates()
  })

  it('resolves to "present" immediately from the cached ListEarnPositions while the live query is pending', () => {
    // Explore/portfolio already cached this vault's position, so the modal should not briefly render
    // the deposit-only state while GetEarnPosition loads.
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { positions: [DATA_API_POSITION], isSuccess: true },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Present)
    expect(result.current.position?.vaultId).toBe(VAULT_ID)
  })

  it('resolves to "noPosition" when the cached list has loaded without this vault', () => {
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { positions: [], isSuccess: true },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.NoPosition)
    expect(result.current.position).toBeUndefined()
  })

  it('stays "loading" when there is no cache hint and the live query is still pending (cold entry)', () => {
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { isSuccess: false },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Loading)
    expect(result.current.position).toBeUndefined()
  })

  it('uses the live GetEarnPosition result once it resolves', () => {
    mockQueries({
      livePosition: { data: DATA_API_POSITION, isSuccess: true },
      cachedPositions: { isSuccess: false },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Present)
    expect(result.current.position?.vaultId).toBe(VAULT_ID)
  })

  it('prefers an explicit prefetchedPosition over the cache while pending', () => {
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { isSuccess: false },
    })

    const { result } = renderEarnPosition({
      prefetchedPosition: PREFETCHED_POSITION,
    })

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Present)
    expect(result.current.position?.vaultId).toBe(VAULT_ID)
  })

  it('drops a prefetched position after an authoritative empty response', (): void => {
    mockQueries({
      livePosition: { isSuccess: true },
      cachedPositions: { isSuccess: false },
    })

    const { result } = renderEarnPosition({
      prefetchedPosition: PREFETCHED_POSITION,
    })

    expect(result.current.positionStatus).toBe(EarnPositionStatus.NoPosition)
    expect(result.current.position).toBeUndefined()
  })

  it('reports "error", not "noPosition", when the live query fails with no other source', () => {
    // A transient GetEarnPosition failure is not positive knowledge of no position — consumers (e.g. the
    // earn swap toggle) must not treat it as confirmed no-position and clear user intent.
    mockQueries({
      livePosition: { isError: true, isSuccess: false },
      cachedPositions: { isSuccess: false },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Error)
    expect(result.current.position).toBeUndefined()
    expect(result.current.isError).toBe(true)
  })

  it('falls back to the cached list position when the live query fails', () => {
    mockQueries({
      livePosition: { isError: true, isSuccess: false },
      cachedPositions: { positions: [DATA_API_POSITION], isSuccess: true },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.Present)
    expect(result.current.position?.vaultId).toBe(VAULT_ID)
  })

  it('resolves to "noPosition" on live-query error when the cached list has loaded without this vault', () => {
    mockQueries({
      livePosition: { isError: true, isSuccess: false },
      cachedPositions: { positions: [], isSuccess: true },
    })

    const { result } = renderEarnPosition()

    expect(result.current.positionStatus).toBe(EarnPositionStatus.NoPosition)
    expect(result.current.position).toBeUndefined()
  })

  it('treats a disconnected wallet as no-position so a hint never leaks across sessions', () => {
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { positions: [DATA_API_POSITION], isSuccess: true },
    })

    const { result } = renderEarnPosition({ isConnected: false })

    expect(result.current.positionStatus).toBe(EarnPositionStatus.NoPosition)
    expect(result.current.position).toBeUndefined()
  })

  it('does not apply optimistic position updates while disconnected', () => {
    mockQueries({
      livePosition: { isLoading: true, isSuccess: false },
      cachedPositions: { isSuccess: false },
    })
    useOptimisticEarnPositionStore.getState().addUpdate({
      id: 'update-1',
      action: EarnAction.Deposit,
      createdAtMs: 1,
      depositedUsd: 50,
      baselineSharesRaw: '0',
      walletAddress: normalizeTokenAddressForCache(WALLET_ADDRESS),
      vaultAddress: normalizeTokenAddressForCache(VAULT_ADDRESS),
      vaultChainId: UniverseChainId.Mainnet,
      vaultId: VAULT_ID,
      vaultApyPercent: 5,
    })

    const { result } = renderEarnPosition({ isConnected: false })

    expect(result.current.positionStatus).toBe(EarnPositionStatus.NoPosition)
    expect(result.current.position).toBeUndefined()
  })
})

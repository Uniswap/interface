import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useOptimisticEarnPositionStore } from 'uniswap/src/features/earn/optimisticEarnPositions'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { getEarnVaultId } from 'uniswap/src/features/earn/utils'

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
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC_VAULT_ADDRESS = '0x1111111111111111111111111111111111111111'
const DAI_VAULT_ADDRESS = '0x2222222222222222222222222222222222222222'
const USDC_VAULT_ID = getEarnVaultId({
  chainId: UniverseChainId.Mainnet,
  vaultAddress: USDC_VAULT_ADDRESS,
})
const DAI_VAULT_ID = getEarnVaultId({
  chainId: UniverseChainId.Mainnet,
  vaultAddress: DAI_VAULT_ADDRESS,
})

function createVault({
  address,
  decimals,
  symbol,
  vaultAddress,
}: {
  address: string
  decimals: number
  symbol: string
  vaultAddress: string
}): DataApiEarnVault {
  return new DataApiEarnVault({
    address: vaultAddress,
    chainId: UniverseChainId.Mainnet,
    name: `${symbol} Vault`,
    symbol: `gt${symbol}`,
    underlyingToken: new Token({
      chainId: UniverseChainId.Mainnet,
      address,
      decimals,
      name: symbol,
      symbol,
      type: TokenType.ERC20,
    }),
    netApy: 0.05,
  })
}

const USDC_VAULT = createVault({
  address: USDC_ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  vaultAddress: USDC_VAULT_ADDRESS,
})
const DAI_VAULT = createVault({
  address: DAI_ADDRESS,
  decimals: 18,
  symbol: 'DAI',
  vaultAddress: DAI_VAULT_ADDRESS,
})

function mockQueryResult<TData>({
  data,
  isFetchedAfterMount = true,
  isFetching = false,
  isPlaceholderData = false,
  isLoading = false,
  isSuccess = true,
}: {
  data: TData | undefined
  isFetchedAfterMount?: boolean
  isFetching?: boolean
  isPlaceholderData?: boolean
  isLoading?: boolean
  isSuccess?: boolean
}): ReturnType<typeof useQuery> {
  return {
    data,
    error: null,
    isError: false,
    isFetchedAfterMount,
    isFetching,
    isPlaceholderData,
    isLoading,
    isSuccess,
  } as unknown as ReturnType<typeof useQuery>
}

function mockEarnQueries({
  positions,
  vaults,
  positionsFetchedAfterMount = true,
  positionsFetching = false,
  positionsLoading = false,
  positionsPlaceholder = false,
  vaultsLoading = false,
  positionsSuccess = true,
}: {
  positions?: DataApiEarnPosition[]
  vaults?: DataApiEarnVault[]
  positionsFetchedAfterMount?: boolean
  positionsFetching?: boolean
  positionsLoading?: boolean
  positionsPlaceholder?: boolean
  vaultsLoading?: boolean
  positionsSuccess?: boolean
} = {}): void {
  useQueryMock.mockImplementation(
    ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
      switch (queryKey?.[1]) {
        case 'listEarnVaults': {
          const data = vaults ? { vaults } : undefined
          return mockQueryResult({
            data: select && data ? select(data) : data,
            isLoading: vaultsLoading,
          })
        }
        case 'listEarnPositions': {
          // queryKey[2] is the positions request params, which is undefined when no account is set.
          if (queryKey[2] === undefined) {
            return mockQueryResult({ data: undefined, isSuccess: false })
          }
          const data = positions ? { positions } : undefined
          return mockQueryResult({
            data: select && data ? select(data) : data,
            isFetchedAfterMount: positionsFetchedAfterMount,
            isFetching: positionsFetching,
            isPlaceholderData: positionsPlaceholder,
            isLoading: positionsLoading,
            isSuccess: positionsSuccess,
          })
        }
        default:
          return mockQueryResult({ data: undefined, isSuccess: false })
      }
    },
  )
}

describe(useEarnVaults, () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    useOptimisticEarnPositionStore.getState().clearUpdates()
  })

  it('returns empty defaults when both queries are disabled', () => {
    mockEarnQueries()

    const { result } = renderHook(() => useEarnVaults({ enabled: false }))

    expect(result.current.vaults).toEqual([])
    expect(result.current.positionsByVaultId.size).toBe(0)
    expect(result.current.totalDepositedUsd).toBe(0)
    expect(result.current.vaultsSortedByPosition).toEqual([])
    expect(result.current.hasLoadedPositions).toBe(false)
  })

  it('skips the positions query when no account is provided', () => {
    mockEarnQueries({ vaults: [USDC_VAULT] })

    const { result } = renderHook(() => useEarnVaults())

    expect(result.current.vaults).toHaveLength(1)
    expect(result.current.positionsByVaultId.size).toBe(0)
    expect(result.current.hasLoadedPositions).toBe(false)
  })

  it('does not surface stale position data after the account disconnects', () => {
    useQueryMock.mockImplementation(
      ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
        switch (queryKey?.[1]) {
          case 'listEarnVaults': {
            const data = { vaults: [USDC_VAULT] }
            return mockQueryResult({ data: select ? select(data) : data })
          }
          case 'listEarnPositions': {
            const staleData = {
              positions: [
                new DataApiEarnPosition({
                  vault: USDC_VAULT,
                  sharesRaw: '1000000',
                  currentAssetsRaw: '100000000',
                  currentAssetsUsd: 100,
                }),
              ],
            }
            return mockQueryResult({
              data: select ? select(staleData) : staleData,
              isSuccess: false,
            })
          }
          default:
            return mockQueryResult({ data: undefined, isSuccess: false })
        }
      },
    )

    const { result } = renderHook(() => useEarnVaults())

    expect(result.current.vaults).toHaveLength(1)
    expect(result.current.positionsByVaultId.size).toBe(0)
    expect(result.current.totalDepositedUsd).toBe(0)
  })

  it('preserves cached positions after a background refetch error', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '100000000',
          currentAssetsUsd: 100,
        }),
      ],
      positionsSuccess: false,
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.positionsByVaultId.size).toBe(1)
    expect(result.current.totalDepositedUsd).toBe(100)
    expect(result.current.hasLoadedPositions).toBe(true)
  })

  it('does not surface placeholder positions while the current account positions are loading', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '100000000',
          currentAssetsUsd: 100,
        }),
      ],
      positionsPlaceholder: true,
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.positionsByVaultId.size).toBe(0)
    expect(result.current.totalDepositedUsd).toBe(0)
    expect(result.current.hasLoadedPositions).toBe(false)
    expect(result.current.isLoadingPositions).toBe(true)
  })

  it('surfaces current-account cached positions while a fresh positions fetch is in flight', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '100000000',
          currentAssetsUsd: 100,
        }),
      ],
      positionsFetchedAfterMount: false,
      positionsFetching: true,
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.positionsByVaultId.size).toBe(1)
    expect(result.current.totalDepositedUsd).toBe(100)
    expect(result.current.hasLoadedPositions).toBe(true)
    expect(result.current.isLoadingPositions).toBe(false)
  })

  it('surfaces same-account optimistic positions while API positions are unresolved', () => {
    useOptimisticEarnPositionStore.getState().addUpdate({
      id: 'optimistic-usdc',
      action: EarnAction.Deposit,
      createdAtMs: Date.now(),
      depositedUsd: 42,
      baselineSharesRaw: '0',
      walletAddress: normalizeTokenAddressForCache(WALLET_ADDRESS),
      vaultAddress: normalizeTokenAddressForCache(USDC_VAULT_ADDRESS),
      vaultChainId: UniverseChainId.Mainnet,
      vaultId: USDC_VAULT_ID,
      vaultApyPercent: 5,
    })
    mockEarnQueries({
      vaults: [USDC_VAULT, DAI_VAULT],
      positionsLoading: true,
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.hasLoadedPositions).toBe(false)
    expect(result.current.isLoadingPositions).toBe(true)
    expect(result.current.positionsByVaultId.get(USDC_VAULT_ID)?.depositedUsd).toBe(42)
    expect(result.current.positionsByVaultId.has(DAI_VAULT_ID)).toBe(false)
  })

  it('sums deposited USD for vaults with active positions', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT, DAI_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1000000',
          currentAssetsRaw: '100000000',
          currentAssetsUsd: 100,
        }),
        new DataApiEarnPosition({
          vault: DAI_VAULT,
          sharesRaw: '500000000000000000',
          currentAssetsRaw: '500000000000000000',
          currentAssetsUsd: 25,
        }),
      ],
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.totalDepositedUsd).toBe(125)
    expect(result.current.positionsByVaultId.size).toBe(2)
    expect(result.current.hasLoadedPositions).toBe(true)
  })

  it('orders vaults so that positions come first, ranked by deposited USD', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT, DAI_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: DAI_VAULT,
          sharesRaw: '500000000000000000',
          currentAssetsRaw: '500000000000000000',
          currentAssetsUsd: 250,
        }),
      ],
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.vaultsSortedByPosition.map((vault) => vault.id)).toEqual([DAI_VAULT_ID, USDC_VAULT_ID])
  })

  it('exposes loading flags only while data has not yet populated', () => {
    mockEarnQueries({ vaultsLoading: true, positionsLoading: true })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.isLoadingVaults).toBe(true)
    expect(result.current.isLoadingPositions).toBe(true)
  })

  it('treats vaults as loaded once data arrives even if isLoading flips back', () => {
    mockEarnQueries({
      vaults: [USDC_VAULT],
      positions: [
        new DataApiEarnPosition({
          vault: USDC_VAULT,
          sharesRaw: '1',
          currentAssetsRaw: '1',
          currentAssetsUsd: 1,
        }),
      ],
      vaultsLoading: true,
      positionsLoading: true,
    })

    const { result } = renderHook(() => useEarnVaults({ account: WALLET_ADDRESS }))

    expect(result.current.isLoadingVaults).toBe(false)
    expect(result.current.isLoadingPositions).toBe(false)
  })
})

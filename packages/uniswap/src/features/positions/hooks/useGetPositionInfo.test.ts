import { waitFor } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { ChainId, CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { useGetPositionInfo } from 'uniswap/src/features/positions/hooks/useGetPositionInfo'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetPosition, mockParseLsPosition } = vi.hoisted(() => ({
  mockGetPosition: vi.fn(),
  mockParseLsPosition: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/liquidityService/liquidityQueries', () => ({
  liquidityQueries: { getPosition: mockGetPosition },
}))

// Keep the real protocol-version mapping (it feeds the LS request); stub only the parser so tests
// assert routing/mapping rather than parse internals.
vi.mock('uniswap/src/features/positions/parseLiquidityServicePosition', async () => {
  const actual = await vi.importActual('uniswap/src/features/positions/parseLiquidityServicePosition')
  return { ...actual, parseLiquidityServicePosition: mockParseLsPosition }
})

// The real provider persists to IndexedDB, which doesn't exist in the test environment — the
// restore never settles and PersistQueryClientProvider pauses every query. Swap in a plain
// QueryClientProvider so the liquidity-service query actually runs.
vi.mock('uniswap/src/data/apiClients/SharedPersistQueryClientProvider', async () => {
  const { QueryClient, QueryClientProvider } = await import('@tanstack/react-query')
  const { createElement } = await import('react')
  const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    SharedPersistQueryClientProvider: ({ children }: { children?: unknown }) =>
      createElement(QueryClientProvider, { client: testQueryClient }, children as React.ReactNode),
  }
})

const WALLET = '0x0000000000000000000000000000000000000123'
const PAIR = '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc'

function primeLsPosition(position: Record<string, unknown> | undefined): void {
  mockGetPosition.mockImplementation(({ params, enabled }: { params?: unknown; enabled?: boolean }) => ({
    queryKey: ['test', 'getPosition', params],
    queryFn: async (): Promise<Record<string, unknown>> => ({ position }),
    enabled,
  }))
}

describe('useGetPositionInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParseLsPosition.mockReturnValue({ poolId: 'ls' } as unknown as PositionInfo)
    primeLsPosition(undefined)
  })

  describe('liquidity-service path', () => {
    it('maps params into the LS GetPosition request and enables the query', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo({ owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V2, pairAddress: PAIR }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            chainId: 1,
            version: Protocols.V2,
            pairAddress: PAIR,
            walletAddress: WALLET,
          }),
          enabled: true,
        }),
      )
    })

    it('disables the LS query for an unsupported protocol version', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo({ owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.UNSPECIFIED }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ params: undefined, enabled: false }))
    })

    it('returns the parsed LS position', async () => {
      primeLsPosition({ id: 'raw-ls' })

      const { result } = renderHookWithProviders(() =>
        useGetPositionInfo({ owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V3, tokenId: '7' }),
      )

      await waitFor(() => expect(result.current.positionInfo).toEqual({ poolId: 'ls' }))
    })
  })

  describe('permissioned reads', () => {
    it('names the PermissionedPositionManager on the request when the chain has one', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo({
          owner: WALLET,
          chainId: ChainId.MAINNET,
          protocolVersion: ProtocolVersion.V4,
          tokenId: '42',
          permissioned: true,
        }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            version: Protocols.V4,
            tokenId: '42',
            positionManagerAddress: CHAIN_TO_ADDRESSES_MAP[ChainId.MAINNET].permissionedV4PositionManagerAddress,
          }),
          enabled: true,
        }),
      )
    })

    it('keeps the query dormant for a permissioned read on a chain with no permissioned manager', () => {
      // Optimism has no permissionedV4PositionManagerAddress; naming the wrong (canonical) manager could
      // surface a different position sharing the tokenId, so the read stays dormant rather than firing.
      renderHookWithProviders(() =>
        useGetPositionInfo({
          owner: WALLET,
          chainId: ChainId.OPTIMISM,
          protocolVersion: ProtocolVersion.V4,
          tokenId: '42',
          permissioned: true,
        }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    })
  })

  describe('polling', () => {
    it('forwards refetchInterval to the LS query so a flow can poll the position', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo(
          { owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V4, tokenId: '7' },
          { refetchInterval: 5000 },
        ),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ refetchInterval: 5000, enabled: true }))
    })

    it('forwards an explicit false so a flow can stop polling without unmounting', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo(
          { owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V4, tokenId: '7' },
          { refetchInterval: false },
        ),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ refetchInterval: false }))
    })

    it('leaves polling off by default', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo({ owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V4, tokenId: '7' }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ refetchInterval: undefined }))
    })
  })

  describe('position-key gating', () => {
    it('leaves the LS query disabled when neither tokenId nor pairAddress is present', () => {
      renderHookWithProviders(() =>
        useGetPositionInfo({ owner: WALLET, chainId: 1, protocolVersion: ProtocolVersion.V3 }),
      )

      expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ params: undefined, enabled: false }))
    })
  })

  it('is safe to call with no params', () => {
    const { result } = renderHookWithProviders(() => useGetPositionInfo())

    expect(result.current.positionInfo).toBeUndefined()
    expect(mockGetPosition).toHaveBeenCalledWith(expect.objectContaining({ params: undefined, enabled: false }))
  })
})

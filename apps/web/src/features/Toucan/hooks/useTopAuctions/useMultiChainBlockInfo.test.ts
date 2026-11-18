import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type EVMUniverseChainId, UniverseChainId } from '@universe/chains'
import { createElement, type ReactNode } from 'react'
import { useMultiChainBlockInfo } from '~/features/Toucan/hooks/useTopAuctions/useMultiChainBlockInfo'

const mockGetPublicClient = vi.fn()

vi.mock('@wagmi/core', () => ({
  getPublicClient: (...args: unknown[]) => mockGetPublicClient(...args),
}))

vi.mock('~/connection/wagmiConfig', () => ({
  wagmiConfig: {},
}))

interface ChainFixture {
  live: { number: bigint; timestamp: bigint }
}

function mockChains(fixtures: Partial<Record<number, ChainFixture>>): void {
  mockGetPublicClient.mockImplementation((_config: unknown, opts: { chainId: number }) => {
    const fixture = fixtures[opts.chainId]
    return fixture && { getBlock: async () => fixture.live }
  })
}

function createWrapper(): ({ children }: { children: ReactNode }) => JSX.Element {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return createElement(QueryClientProvider, { client }, children)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useMultiChainBlockInfo', () => {
  it('returns the live block per requested chain', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: { live: { number: 2000n, timestamp: 1_100_000n } },
      [UniverseChainId.Base]: { live: { number: 9000n, timestamp: 1_200_000n } },
    })

    const { result } = renderHook(
      () => useMultiChainBlockInfo(new Set([UniverseChainId.Mainnet, UniverseChainId.Base])),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.blocksByChain.size).toBe(2))
    expect(result.current.blocksByChain.get(UniverseChainId.Mainnet)).toEqual({ number: 2000n, timestamp: 1_100_000n })
    expect(result.current.blocksByChain.get(UniverseChainId.Base)).toEqual({ number: 9000n, timestamp: 1_200_000n })
    expect(result.current.pendingChainIds.size).toBe(0)
  })

  it('keeps the same result across rerenders until a block changes', async () => {
    mockChains({ [UniverseChainId.Mainnet]: { live: { number: 2000n, timestamp: 1_100_000n } } })
    const chainIds = new Set<EVMUniverseChainId>([UniverseChainId.Mainnet])

    const { result, rerender } = renderHook(() => useMultiChainBlockInfo(chainIds), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.blocksByChain.size).toBe(1))

    const settled = result.current
    rerender()

    expect(result.current).toBe(settled)
  })

  it('omits a chain whose client is unavailable and stops waiting on it', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: { live: { number: 2000n, timestamp: 1_100_000n } },
    })

    const { result } = renderHook(
      () => useMultiChainBlockInfo(new Set([UniverseChainId.Mainnet, UniverseChainId.Base])),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.pendingChainIds.size).toBe(0))
    expect(result.current.blocksByChain.size).toBe(1)
    expect(result.current.blocksByChain.get(UniverseChainId.Mainnet)).toBeDefined()
    expect(result.current.blocksByChain.get(UniverseChainId.Base)).toBeUndefined()
  })
})

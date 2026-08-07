import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Block } from '~/chains'
import {
  useGetBlockTimestamps,
  useMultiChainBlockInfo,
  type BlockTimestampRequest,
} from '~/hooks/useMultiChainBlockInfo'

const mockGetPublicClient = vi.fn()

vi.mock('@wagmi/core', () => ({
  getPublicClient: (...args: unknown[]) => mockGetPublicClient(...args),
}))

vi.mock('~/connection/wagmiConfig', () => ({
  wagmiConfig: {},
}))

interface ChainFixture {
  live: { number: bigint; timestamp: bigint }
  pastBlocks?: Record<string, bigint>
}

// Tracks getBlock calls per chain so dedup behavior can be asserted
const getBlockCalls: { chainId: number; blockNumber?: bigint }[] = []

function mockChains(fixtures: Partial<Record<number, ChainFixture>>): void {
  mockGetPublicClient.mockImplementation((_config: unknown, opts: { chainId: number }) => {
    const fixture = fixtures[opts.chainId]
    if (!fixture) {
      return undefined
    }
    return {
      getBlock: async (args?: { blockNumber?: bigint }) => {
        getBlockCalls.push({ chainId: opts.chainId, blockNumber: args?.blockNumber })
        if (args?.blockNumber === undefined) {
          return fixture.live
        }
        const timestamp = fixture.pastBlocks?.[args.blockNumber.toString()]
        if (timestamp === undefined) {
          throw new Error(`No fixture for block ${args.blockNumber} on chain ${opts.chainId}`)
        }
        return { number: args.blockNumber, timestamp }
      },
    }
  })
}

function createWrapper(): ({ children }: { children: ReactNode }) => JSX.Element {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return createElement(QueryClientProvider, { client }, children)
  }
}

function blocksByChainOf(entries: [number, { number: bigint; timestamp: bigint }][]): Map<number, Block> {
  return new Map(entries.map(([chainId, block]) => [chainId, block as Block]))
}

beforeEach(() => {
  vi.clearAllMocks()
  getBlockCalls.length = 0
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

    await waitFor(() => expect(result.current.size).toBe(2))
    expect(result.current.get(UniverseChainId.Mainnet)).toEqual({ number: 2000n, timestamp: 1_100_000n })
    expect(result.current.get(UniverseChainId.Base)).toEqual({ number: 9000n, timestamp: 1_200_000n })
  })

  it('omits chains whose client is unavailable', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: { live: { number: 2000n, timestamp: 1_100_000n } },
    })

    const { result } = renderHook(
      () => useMultiChainBlockInfo(new Set([UniverseChainId.Mainnet, UniverseChainId.Base])),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.size).toBe(1))
    expect(result.current.get(UniverseChainId.Mainnet)).toBeDefined()
    expect(result.current.get(UniverseChainId.Base)).toBeUndefined()
  })
})

describe('useGetBlockTimestamps', () => {
  it('returns actual RPC timestamps for past blocks', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: {
        live: { number: 2000n, timestamp: 1_100_000n },
        pastBlocks: { '900': 900_000n },
      },
    })
    const requests: BlockTimestampRequest[] = [{ chainId: UniverseChainId.Mainnet, blockNumber: '900' }]
    const blocksByChain = blocksByChainOf([[UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }]])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '900')).toBe(900_000n))
  })

  it('estimates future blocks with the rate derived from the past anchor and the live block', async () => {
    // Real rate: (1_100_000s - 1_000_000s) / (2000 - 1000) = 100s/block vs Mainnet constant 12s/block
    mockChains({
      [UniverseChainId.Mainnet]: {
        live: { number: 2000n, timestamp: 1_100_000n },
        pastBlocks: { '1000': 1_000_000n },
      },
    })
    const requests: BlockTimestampRequest[] = [
      { chainId: UniverseChainId.Mainnet, blockNumber: '1000' },
      { chainId: UniverseChainId.Mainnet, blockNumber: '2100' },
    ]
    const blocksByChain = blocksByChainOf([[UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }]])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    // anchor(1000 @ 1_000_000s) + 1100 blocks * 100s = 1_110_000s
    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '2100')).toBe(1_110_000n))
    // Not the chain-constant extrapolation (1_100_000s + 100 * 12s)
    expect(result.current(UniverseChainId.Mainnet, '2100')).not.toBe(1_101_200n)
  })

  it('calibrates against the earliest fetched past block on each chain', async () => {
    // Block 1000 yields 100s/block; block 1500 would yield 20s/block. Earliest must win.
    mockChains({
      [UniverseChainId.Mainnet]: {
        live: { number: 2000n, timestamp: 1_100_000n },
        pastBlocks: { '1000': 1_000_000n, '1500': 1_090_000n },
      },
    })
    const requests: BlockTimestampRequest[] = [
      { chainId: UniverseChainId.Mainnet, blockNumber: '1500' },
      { chainId: UniverseChainId.Mainnet, blockNumber: '1000' },
      { chainId: UniverseChainId.Mainnet, blockNumber: '2100' },
    ]
    const blocksByChain = blocksByChainOf([[UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }]])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '2100')).toBe(1_110_000n))
  })

  it('falls back to the chain-constant rate when no past anchor exists', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: { live: { number: 2000n, timestamp: 1_100_000n } },
      [UniverseChainId.Base]: { live: { number: 2000n, timestamp: 1_100_000n } },
    })
    const requests: BlockTimestampRequest[] = [
      { chainId: UniverseChainId.Mainnet, blockNumber: '2100' },
      { chainId: UniverseChainId.Base, blockNumber: '2100' },
    ]
    const blocksByChain = blocksByChainOf([
      [UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }],
      [UniverseChainId.Base, { number: 2000n, timestamp: 1_100_000n }],
    ])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    // Mainnet: 12s/block -> +1200s; Base: 2s/block -> +200s
    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '2100')).toBe(1_101_200n))
    expect(result.current(UniverseChainId.Base, '2100')).toBe(1_100_200n)
  })

  it('deduplicates repeated (chainId, blockNumber) requests', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: {
        live: { number: 2000n, timestamp: 1_100_000n },
        pastBlocks: { '900': 900_000n },
      },
    })
    const requests: BlockTimestampRequest[] = [
      { chainId: UniverseChainId.Mainnet, blockNumber: '900' },
      { chainId: UniverseChainId.Mainnet, blockNumber: '900' },
    ]
    const blocksByChain = blocksByChainOf([[UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }]])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '900')).toBe(900_000n))
    expect(getBlockCalls.filter((call) => call.blockNumber === 900n)).toHaveLength(1)
  })

  it('returns undefined for pairs that were never requested', async () => {
    mockChains({
      [UniverseChainId.Mainnet]: {
        live: { number: 2000n, timestamp: 1_100_000n },
        pastBlocks: { '900': 900_000n },
      },
    })
    const requests: BlockTimestampRequest[] = [{ chainId: UniverseChainId.Mainnet, blockNumber: '900' }]
    const blocksByChain = blocksByChainOf([[UniverseChainId.Mainnet, { number: 2000n, timestamp: 1_100_000n }]])

    const { result } = renderHook(() => useGetBlockTimestamps(requests, blocksByChain), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current(UniverseChainId.Mainnet, '900')).toBe(900_000n))
    expect(result.current(UniverseChainId.Mainnet, '901')).toBeUndefined()
  })
})

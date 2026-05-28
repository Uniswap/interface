import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useOrderedMultichainEntries } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/chains/hooks/useOrderedChainIds', () => ({
  useOrderedChainIds: vi.fn(),
}))

describe(useOrderedMultichainEntries, () => {
  const ENTRIES: MultichainTokenEntry[] = [
    { chainId: UniverseChainId.Base, address: '0xBase', isNative: false },
    { chainId: UniverseChainId.Mainnet, address: '0xMainnet', isNative: false },
    { chainId: UniverseChainId.ArbitrumOne, address: '0xArbitrum', isNative: false },
  ]

  beforeEach(() => {
    // Return order: Ethereum first, then Arbitrum, then Base
    vi.mocked(useOrderedChainIds).mockReturnValue([
      UniverseChainId.Mainnet,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Base,
    ])
  })

  it('sorts entries to match useOrderedChainIds order', () => {
    const { result } = renderHook(() => useOrderedMultichainEntries(ENTRIES))

    expect(result.current.map((e) => e.chainId)).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Base,
    ])
  })

  it('returns empty array for empty input', () => {
    vi.mocked(useOrderedChainIds).mockReturnValue([])

    const { result } = renderHook(() => useOrderedMultichainEntries([]))

    expect(result.current).toEqual([])
  })

  it('returns stable reference on re-render with same input', () => {
    const { result, rerender } = renderHook(() => useOrderedMultichainEntries(ENTRIES))

    const firstResult = result.current
    rerender()

    expect(result.current).toBe(firstResult)
  })

  it('returns stable reference when entries is a new array with the same deployments', () => {
    const entriesA = [...ENTRIES]
    const entriesB = ENTRIES.map((e) => ({ ...e }))

    const { result, rerender } = renderHook((entries: MultichainTokenEntry[]) => useOrderedMultichainEntries(entries), {
      initialProps: [entriesA],
    })

    const firstResult = result.current
    rerender([entriesB])

    expect(result.current).toBe(firstResult)
    expect(result.current.map((e) => e.chainId)).toEqual([
      UniverseChainId.Mainnet,
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Base,
    ])
  })
})

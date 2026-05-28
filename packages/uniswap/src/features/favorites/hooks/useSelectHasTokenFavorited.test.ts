import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { useSelectHasTokenFavorited } from 'uniswap/src/features/favorites/hooks/useSelectHasTokenFavorited'
import { FavoritesState } from 'uniswap/src/features/favorites/slice'
import { renderHook } from 'uniswap/src/test/test-utils'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(() => false),
  }
})

vi.mock('uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings', () => ({
  useMultichainFavoritesRankings: vi.fn(() => ({
    canonicalByKey: new Map(),
    networkCountByKey: new Map(),
    tokenRankingsData: undefined,
  })),
}))

const MAINNET_USDC = '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const ARBITRUM_USDC = '42161-0xaf88d065e77c8cc2239327c5edb3a432268e5831'
const BASE_USDC = '8453-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'

function enableMultichainFlag(): void {
  vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.MultichainTokenUx)
}

function setCanonicalLookup(entries: Array<[string, string]>): void {
  vi.mocked(useMultichainFavoritesRankings).mockReturnValue({
    canonicalByKey: new Map(entries),
    networkCountByKey: new Map(),
    tokenRankingsData: undefined,
  })
}

describe(useSelectHasTokenFavorited, () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useMultichainFavoritesRankings).mockReturnValue({
      canonicalByKey: new Map(),
      networkCountByKey: new Map(),
      tokenRankingsData: undefined,
    })
  })

  describe('with multichain flag OFF', () => {
    it('returns true for an exact CurrencyId match', () => {
      const { result } = renderHook(() => useSelectHasTokenFavorited(MAINNET_USDC), {
        preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(true)
    })

    it('returns false when only a different-chain version is favorited (exact match only)', () => {
      const { result } = renderHook(() => useSelectHasTokenFavorited(ARBITRUM_USDC), {
        preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(false)
    })
  })

  describe('with multichain flag ON', () => {
    beforeEach(() => {
      enableMultichainFlag()
    })

    it('returns true for a cross-chain project match via canonical lookup (Arbitrum USDC → stored Mainnet USDC)', () => {
      setCanonicalLookup([
        [ARBITRUM_USDC, MAINNET_USDC],
        [BASE_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])

      const { result } = renderHook(() => useSelectHasTokenFavorited(ARBITRUM_USDC), {
        preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(true)
    })

    it('returns true for the canonical token itself when favorited', () => {
      setCanonicalLookup([[MAINNET_USDC, MAINNET_USDC]])

      const { result } = renderHook(() => useSelectHasTokenFavorited(MAINNET_USDC), {
        preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(true)
    })

    it('returns false when neither canonical nor address match exists', () => {
      setCanonicalLookup([
        [ARBITRUM_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])

      const { result } = renderHook(() => useSelectHasTokenFavorited(ARBITRUM_USDC), {
        preloadedState: { favorites: { tokens: [], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(false)
    })

    it('falls back to address-only match for tokens not in rankings (same address across chains)', () => {
      const mainnetSameAddress = '1-0x0000000000000000000000000000000000000aaa'
      const arbitrumSameAddress = '42161-0x0000000000000000000000000000000000000aaa'

      const { result } = renderHook(() => useSelectHasTokenFavorited(arbitrumSameAddress), {
        preloadedState: {
          favorites: { tokens: [mainnetSameAddress], watchedAddresses: [] } as FavoritesState,
        },
      })

      expect(result.current).toBe(true)
    })

    it('returns false for an unrelated token even when canonical map is populated', () => {
      setCanonicalLookup([
        [ARBITRUM_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])
      const unrelated = '1-0x1111111111111111111111111111111111111111'

      const { result } = renderHook(() => useSelectHasTokenFavorited(unrelated), {
        preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
      })

      expect(result.current).toBe(false)
    })
  })
})

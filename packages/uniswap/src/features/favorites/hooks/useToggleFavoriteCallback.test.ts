import { act } from '@testing-library/react-native'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMultichainFavoritesRankings } from 'uniswap/src/features/favorites/hooks/useMultichainFavoritesRankings'
import { useSelectHasTokenFavorited } from 'uniswap/src/features/favorites/hooks/useSelectHasTokenFavorited'
import { useToggleFavoriteCallback } from 'uniswap/src/features/favorites/hooks/useToggleFavoriteCallback'
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
const UNICHAIN_USDC = '130-0x078d782b760474a361dda0af3839290b0ef57ad6'
const MAINNET_ETH = '1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
const ARBITRUM_ETH = '42161-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const EMPTY_FAVORITES: FavoritesState = { tokens: [], watchedAddresses: [] }

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

describe(useToggleFavoriteCallback, () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useMultichainFavoritesRankings).mockReturnValue({
      canonicalByKey: new Map(),
      networkCountByKey: new Map(),
      tokenRankingsData: undefined,
    })
  })

  describe('adding favorites with multichain flag OFF', () => {
    it('dispatches the normalized currencyId as-is', () => {
      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: false }),
        { preloadedState: { favorites: EMPTY_FAVORITES } },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([ARBITRUM_USDC])
    })
  })

  describe('adding favorites with multichain flag ON', () => {
    beforeEach(() => {
      enableMultichainFlag()
    })

    it('stores the canonical mainnet CurrencyId when adding a non-mainnet token', () => {
      setCanonicalLookup([[ARBITRUM_USDC, MAINNET_USDC]])

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: false }),
        { preloadedState: { favorites: EMPTY_FAVORITES } },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([MAINNET_USDC])
    })

    it('dedupes when the canonical token is already favorited', () => {
      setCanonicalLookup([[ARBITRUM_USDC, MAINNET_USDC]])

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: false }),
        {
          preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
        },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([MAINNET_USDC])
    })

    it('falls back to the input currencyId when canonical lookup has no entry', () => {
      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: false }),
        { preloadedState: { favorites: EMPTY_FAVORITES } },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([ARBITRUM_USDC])
    })

    it('stores the canonical Mainnet ETH CurrencyId when favoriting native ETH from a non-mainnet chain', () => {
      setCanonicalLookup([
        [ARBITRUM_ETH, MAINNET_ETH],
        [MAINNET_ETH, MAINNET_ETH],
      ])

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_ETH, tokenName: 'ETH', isFavoriteToken: false }),
        { preloadedState: { favorites: EMPTY_FAVORITES } },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([MAINNET_ETH])
    })
  })

  describe('removing favorites with multichain flag OFF', () => {
    it('removes only the exact stored CurrencyId (no canonical or address fallback)', () => {
      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: true }),
        {
          preloadedState: { favorites: { tokens: [ARBITRUM_USDC], watchedAddresses: [] } as FavoritesState },
        },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([])
    })

    it('does not consult the canonical lookup when the flag is off, even if it would otherwise match', () => {
      // Canonical map is populated, but flag-off should ignore it. User tapping Arbitrum USDC must
      // not remove the Mainnet USDC entry — flag-off behavior is strict, chain-specific matching.
      setCanonicalLookup([[ARBITRUM_USDC, MAINNET_USDC]])

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: true }),
        {
          preloadedState: { favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState },
        },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([MAINNET_USDC])
    })
  })

  describe('removing favorites with multichain flag ON', () => {
    beforeEach(() => {
      enableMultichainFlag()
    })

    it('removes a favorite stored under a different chain when token has the same address', () => {
      const mainnetSameAddress = '1-0x0000000000000000000000000000000000000aaa'
      const arbitrumSameAddress = '42161-0x0000000000000000000000000000000000000aaa'

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: arbitrumSameAddress, tokenName: 'AAA', isFavoriteToken: true }),
        {
          preloadedState: {
            favorites: { tokens: [mainnetSameAddress], watchedAddresses: [] } as FavoritesState,
          },
        },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([])
    })

    it('removes the canonical favorite when toggling off a non-mainnet token with a different per-chain address (USDC across chains)', () => {
      setCanonicalLookup([
        [UNICHAIN_USDC, MAINNET_USDC],
        [ARBITRUM_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])

      const { result, store } = renderHook(
        () => useToggleFavoriteCallback({ id: UNICHAIN_USDC, tokenName: 'USDC', isFavoriteToken: true }),
        {
          preloadedState: {
            favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState,
          },
        },
      )
      act(() => result.current())

      expect(store.getState().favorites.tokens).toEqual([])
    })
  })

  describe('round-trip with useSelectHasTokenFavorited (multichain flag ON)', () => {
    beforeEach(() => {
      enableMultichainFlag()
    })

    it('favoriting from Arbitrum USDC makes the selector report favorited on every USDC chain', () => {
      setCanonicalLookup([
        [ARBITRUM_USDC, MAINNET_USDC],
        [UNICHAIN_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])

      // Step 1: simulate the context-menu flow on Arbitrum USDC — selector says "not favorited",
      // user taps the heart, toggle dispatches the add.
      const { result: arbitrumToggle, store } = renderHook(
        () => useToggleFavoriteCallback({ id: ARBITRUM_USDC, tokenName: 'USDC', isFavoriteToken: false }),
        { preloadedState: { favorites: EMPTY_FAVORITES } },
      )
      act(() => arbitrumToggle.current())

      expect(store.getState().favorites.tokens).toEqual([MAINNET_USDC])

      // Step 2: given the resulting stored state, the selector must report favorited regardless of
      // which chain's USDC CurrencyId it's asked about — this is what powers the heart / long-press
      // label across Token Details, Explore, and search surfaces.
      const persisted = {
        favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState,
      }
      const arbitrum = renderHook(() => useSelectHasTokenFavorited(ARBITRUM_USDC), { preloadedState: persisted })
      const unichain = renderHook(() => useSelectHasTokenFavorited(UNICHAIN_USDC), { preloadedState: persisted })
      const mainnet = renderHook(() => useSelectHasTokenFavorited(MAINNET_USDC), { preloadedState: persisted })

      expect(arbitrum.result.current).toBe(true)
      expect(unichain.result.current).toBe(true)
      expect(mainnet.result.current).toBe(true)
    })

    it('unfavoriting from a different chain than the stored entry clears the canonical favorite in one tap', () => {
      setCanonicalLookup([
        [UNICHAIN_USDC, MAINNET_USDC],
        [MAINNET_USDC, MAINNET_USDC],
      ])

      // Store canonical Mainnet USDC (as migration / canonicalize-on-add would).
      const stored = {
        favorites: { tokens: [MAINNET_USDC], watchedAddresses: [] } as FavoritesState,
      }

      // User is viewing Unichain USDC. Selector reports favorited (via canonical).
      const selector = renderHook(() => useSelectHasTokenFavorited(UNICHAIN_USDC), { preloadedState: stored })
      expect(selector.result.current).toBe(true)

      // Toggle off from Unichain — resolves to the stored Mainnet entry and removes it.
      const { result: unichainToggle, store } = renderHook(
        () => useToggleFavoriteCallback({ id: UNICHAIN_USDC, tokenName: 'USDC', isFavoriteToken: true }),
        { preloadedState: stored },
      )
      act(() => unichainToggle.current())

      expect(store.getState().favorites.tokens).toEqual([])
    })
  })
})

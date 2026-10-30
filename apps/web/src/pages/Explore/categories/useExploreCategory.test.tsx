import { act, renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import type { PropsWithChildren } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import {
  categoryFromParam,
  ExploreCategory,
  getExploreStocksTableURL,
  getExploreTokensURL,
  useExploreCategory,
} from '~/pages/Explore/categories/useExploreCategory'
import { mocked } from '~/test-utils/mocked'
import { getChainUrlParam } from '~/utils/params/chainParams'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: vi.fn(),
}))

function mockTestnetMode(isTestnetModeEnabled: boolean): void {
  mocked(useEnabledChains).mockReturnValue({
    chains: [],
    gqlChains: [],
    defaultChainId: UniverseChainId.Mainnet,
    isTestnetModeEnabled,
  })
}

const VALID_IDS: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs', 'defi'])

describe('categoryFromParam', () => {
  it('defaults to all', () => {
    expect(categoryFromParam({ value: null, validCategoryIds: VALID_IDS })).toBe(ExploreCategory.All)
  })

  it('passes through valid category ids', () => {
    expect(categoryFromParam({ value: 'stocks', validCategoryIds: VALID_IDS })).toBe('stocks')
    expect(categoryFromParam({ value: 'defi', validCategoryIds: VALID_IDS })).toBe('defi')
  })

  it('maps unknown category values to all', () => {
    expect(categoryFromParam({ value: 'unknown', validCategoryIds: VALID_IDS })).toBe(ExploreCategory.All)
  })

  it('hydrates a dynamic id once it joins the valid set', () => {
    const staticOnly: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs'])
    expect(categoryFromParam({ value: 'defi', validCategoryIds: staticOnly })).toBe(ExploreCategory.All)
    expect(categoryFromParam({ value: 'defi', validCategoryIds: VALID_IDS })).toBe('defi')
  })

  describe('while categories are unverified', () => {
    const staticOnly: ReadonlySet<string> = new Set(['stocks', 'commodities', 'etfs'])

    it('trusts a well-formed slug that is not yet in the valid set', () => {
      expect(categoryFromParam({ value: 'defi', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe('defi')
      expect(categoryFromParam({ value: 'ai-agents', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
        'ai-agents',
      )
    })

    it.each(['DeFi', 'de fi', 'defi_', '-defi', 'defi/agents', 'a'.repeat(65)])(
      'still maps the malformed slug %j to all',
      (value) => {
        expect(categoryFromParam({ value, validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
          ExploreCategory.All,
        )
      },
    )

    it('drops a trusted slug back to all once the resolved set excludes it', () => {
      expect(categoryFromParam({ value: 'bogus', validCategoryIds: staticOnly, trustUnverifiedIds: true })).toBe(
        'bogus',
      )
      expect(categoryFromParam({ value: 'bogus', validCategoryIds: VALID_IDS, trustUnverifiedIds: false })).toBe(
        ExploreCategory.All,
      )
    })
  })
})

describe('getExploreTokensURL', () => {
  it('returns explore tokens URL without a category param', () => {
    expect(getExploreTokensURL()).toBe('/explore/tokens')
  })
})

describe('getExploreStocksTableURL', () => {
  it('returns explore tokens URL with stocks category param', () => {
    expect(getExploreStocksTableURL()).toBe('/explore/tokens?category=stocks')
  })
})

describe('useExploreCategory', () => {
  const SOLANA = getChainUrlParam(UniverseChainId.Solana)
  const ETHEREUM = getChainUrlParam(UniverseChainId.Mainnet)

  function useHarness({
    kind = 'token',
    validCategoryIds = VALID_IDS,
  }: { kind?: CategoryKind; validCategoryIds?: ReadonlySet<string> } = {}) {
    const [category, setCategory] = useExploreCategory({ kind, validCategoryIds, trustUnverifiedIds: false })
    const { pathname, search } = useLocation()
    return { category, setCategory, url: `${pathname}${search}` }
  }

  // Mirrors the app's `/explore` route: the parent element stays mounted across chain-segment changes.
  function renderAt(path: string, harnessProps?: Parameters<typeof useHarness>[0]) {
    const wrapper = ({ children }: PropsWithChildren) => (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/explore" element={children}>
            <Route path=":tab" element={children} />
            <Route path=":tab/:chainName" element={children} />
          </Route>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    )
    return renderHook(() => useHarness(harnessProps), { wrapper })
  }

  beforeEach(() => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)
    mockTestnetMode(false)
  })

  it('keeps the network when picking a category on an EVM chain', () => {
    const { result } = renderAt(`/explore/tokens/${ETHEREUM}`)

    act(() => result.current.setCategory('defi'))

    expect(result.current.category).toBe('defi')
    expect(result.current.url).toBe(`/explore/tokens/${ETHEREUM}?category=defi`)
  })

  it('reads a Solana deep link with a category as All', () => {
    const { result } = renderAt(`/explore/tokens/${SOLANA}?category=defi`)

    expect(result.current.category).toBe(ExploreCategory.All)
  })

  it('resets the network to All networks when picking a category on Solana', () => {
    const { result } = renderAt(`/explore/tokens/${SOLANA}`)

    act(() => result.current.setCategory('defi'))

    expect(result.current.category).toBe('defi')
    expect(result.current.url).toBe('/explore/tokens?category=defi')
  })

  it('stays on Solana when picking All', () => {
    const { result } = renderAt(`/explore/tokens/${SOLANA}?category=defi`)

    act(() => result.current.setCategory(ExploreCategory.All))

    expect(result.current.url).toBe(`/explore/tokens/${SOLANA}`)
  })

  describe('for pool categories', () => {
    const POOL_IDS: ReadonlySet<string> = new Set(['stable-pools', 'major-pools'])

    it('round-trips the param on whatever path the pools list lives at', () => {
      const { result } = renderAt('/pools?chain=base', { kind: 'pool', validCategoryIds: POOL_IDS })

      act(() => result.current.setCategory('stable-pools'))

      expect(result.current.category).toBe('stable-pools')
      expect(result.current.url).toBe('/pools?chain=base&category=stable-pools')

      act(() => result.current.setCategory(ExploreCategory.All))

      expect(result.current.url).toBe('/pools?chain=base')
    })

    it('reads a token category slug as All', () => {
      const { result } = renderAt('/explore/pools?category=stablecoins', { kind: 'pool', validCategoryIds: POOL_IDS })

      expect(result.current.category).toBe(ExploreCategory.All)
    })

    // Unit guarantee only: Explore redirects Solana off every tab but Tokens, so users never reach this state.
    it('skips the Solana reset for pool lists', () => {
      const { result } = renderAt(`/explore/pools/${SOLANA}?category=major-pools`, {
        kind: 'pool',
        validCategoryIds: POOL_IDS,
      })

      expect(result.current.category).toBe('major-pools')

      act(() => result.current.setCategory('stable-pools'))

      expect(result.current.url).toBe(`/explore/pools/${SOLANA}?category=stable-pools`)
    })
  })

  it('leaves Solana categories alone with token categories off', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)
    const { result } = renderAt(`/explore/tokens/${SOLANA}?category=stocks`)

    expect(result.current.category).toBe('stocks')

    act(() => result.current.setCategory('etfs'))

    expect(result.current.url).toBe(`/explore/tokens/${SOLANA}?category=etfs`)
  })

  it('returns to All when testnet mode turns on', () => {
    const { result, rerender } = renderAt(`/explore/tokens/${ETHEREUM}?category=defi`)
    expect(result.current.category).toBe('defi')

    mockTestnetMode(true)
    rerender()

    expect(result.current.category).toBe(ExploreCategory.All)
    expect(result.current.url).toBe(`/explore/tokens/${ETHEREUM}`)
  })

  it('still lets a category be picked once in testnet mode', () => {
    mockTestnetMode(true)
    const { result } = renderAt('/explore/tokens')

    act(() => result.current.setCategory('defi'))

    expect(result.current.url).toBe('/explore/tokens?category=defi')
  })
})

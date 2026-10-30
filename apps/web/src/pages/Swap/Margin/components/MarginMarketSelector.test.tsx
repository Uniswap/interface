import { fireEvent } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { TestID } from '@universe/test'
import type { PropsWithChildren } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket, type MarginPairGroup, type MarginTokenInfo } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginMarketSelector } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import { render } from '~/test-utils/render'

// Render Modal children inline so the market list is testable without the portal/animation machinery
// (same approach as SearchModal.test.tsx).
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

// Echo the venue prop; the venue→logo mapping itself is covered by MarginVenueLogo.test.tsx.
vi.mock('~/pages/Swap/Margin/components/MarginVenueLogo', () => ({
  MarginVenueLogo: ({ venue }: { venue: string }) => <div data-testid={TestID.MarginVenueLogo} data-venue={venue} />,
}))

// The side toggle reads the form store and the registry; stub it out so the list renders hermetically.
vi.mock('~/pages/Swap/Margin/components/MarginSideToggle', () => ({
  MarginSideToggle: () => null,
}))

const WETH: MarginTokenInfo = {
  address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  symbol: 'WETH',
  decimals: 18,
}
const USDC: MarginTokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}
const CBBTC: MarginTokenInfo = {
  address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  symbol: 'cbBTC',
  decimals: 8,
}
const USDT: MarginTokenInfo = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  symbol: 'USDT',
  decimals: 6,
}

// Two long groups, so an exact row count catches a regrouping that collapses them into one, plus the
// derived-short WETH/USDC group whose collateral leg is the stablecoin.
//
// pairs[0] is deliberately neither the max-leverage nor a would-be max-rate venue: it is the cheapest
// (420 < 510, matching the ascending-rate order groupMarketsIntoPairs produces) but only 3x against
// AAVE_V3's 5x. A row that read pairs[0] for both columns would render 3x, not 5x.
const LONG_ETH_USDC: MarginPairGroup = {
  key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-LONG',
  pairKey: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  base: WETH,
  quote: USDC,
  direction: MarginDirection.LONG,
  pairs: [
    {
      key: 'weth-usdc-MORPHO',
      debt: USDC,
      venue: 'MORPHO',
      direction: MarginDirection.LONG,
      lltvWad: '860000000000000000',
      maxLeverage: 3,
      borrowRateBps: 420,
    },
    {
      key: 'weth-usdc-AAVE_V3',
      debt: USDC,
      venue: 'AAVE_V3',
      direction: MarginDirection.LONG,
      lltvWad: '0',
      maxLeverage: 5,
      borrowRateBps: 510,
    },
  ],
}
const LONG_CBBTC_USDC: MarginPairGroup = {
  key: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-LONG',
  pairKey: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  base: CBBTC,
  quote: USDC,
  direction: MarginDirection.LONG,
  pairs: [
    {
      key: 'cbbtc-usdc-MORPHO',
      debt: USDC,
      venue: 'MORPHO',
      direction: MarginDirection.LONG,
      lltvWad: '860000000000000000',
      maxLeverage: 4,
      borrowRateBps: 380,
    },
  ],
}
// Same exposure leg as LONG_ETH_USDC against a different counter leg — the D23 shape, and the one a
// selector that keyed rows on the traded token alone would swallow.
const LONG_ETH_USDT: MarginPairGroup = {
  key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xdac17f958d2ee523a2206206994597c13d831ec7-LONG',
  pairKey: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xdac17f958d2ee523a2206206994597c13d831ec7',
  base: WETH,
  quote: USDT,
  direction: MarginDirection.LONG,
  pairs: [
    {
      key: 'weth-usdt-MORPHO',
      debt: USDT,
      venue: 'MORPHO',
      direction: MarginDirection.LONG,
      lltvWad: '860000000000000000',
      maxLeverage: 2,
      borrowRateBps: 650,
    },
  ],
}
// Collateral USDC, debt WETH: the pair whose base leg is only reachable through `base`, never through
// the market's own collateral-derived name.
const SHORT_ETH_USDC: MarginPairGroup = {
  key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-SHORT',
  // Collateral→debt, so a short's key is the reversed pair — never the display base/quote.
  pairKey: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  base: WETH,
  quote: USDC,
  direction: MarginDirection.SHORT,
  pairs: [
    {
      key: 'usdc-weth-AAVE_V3',
      debt: WETH,
      venue: 'AAVE_V3',
      lltvWad: '0',
      maxLeverage: 2,
    },
  ],
}

const {
  mockMarket,
  mockSide,
  mockGroups,
  mockIsLoading,
  mockMarketUnresolved,
  mockMarketsError,
  mockRefetch,
  setMarginFormState,
} = vi.hoisted(() => ({
  // Per-test override for the collapsed trigger's market; defaults to a static AAVE_V4 market.
  mockMarket: { current: undefined as MarginMarket | undefined },
  // Filled in below: vi.hoisted runs before the MarginDirection import is bound.
  mockSide: {} as { current: MarginDirection },
  // Per-test registry. Defaults are filled in below, once the fixtures exist.
  mockGroups: { current: [] as MarginPairGroup[] },
  mockIsLoading: { current: false },
  // When true, PairHeaderButton's own getPairMarket(...) ?? markets.at(0) resolves to nothing —
  // exercises its independent guard regardless of what the pair list (`groups`) has.
  mockMarketUnresolved: { current: false },
  mockMarketsError: { current: undefined as unknown },
  mockRefetch: vi.fn(),
  // Hoisted so the spy identity is stable across renders and assertable.
  setMarginFormState: vi.fn(),
}))
mockSide.current = MarginDirection.LONG

const DEFAULT_GROUPS: MarginPairGroup[] = [LONG_ETH_USDC, LONG_CBBTC_USDC, SHORT_ETH_USDC]

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    groups: mockGroups.current,
    markets: [],
    getPairMarket: () =>
      mockMarketUnresolved.current
        ? undefined
        : (mockMarket.current ?? { ...getDefaultMarginMarket(), venue: 'AAVE_V4' }),
    getLive: () => undefined,
    isLoading: mockIsLoading.current,
    isFetching: false,
    error: mockMarketsError.current,
    dataUpdatedAt: 0,
    refetch: mockRefetch,
  }),
}))

// Only USDC resolves, and to a name that differs from its symbol: a row titled from the quote leg
// rather than the base leg then reads "USD Coin", which the short-side test asserts against.
const USDC_INFO: CurrencyInfo = buildCurrencyInfo({
  currency: new Token(MARGIN_CHAIN_ID, USDC.address, USDC.decimals, USDC.symbol, 'USD Coin'),
  currencyId: marginTokenCurrencyId(USDC),
  logoUrl: null,
})

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map([[normalizeCurrencyIdForMapLookup(marginTokenCurrencyId(USDC)), USDC_INFO]]),
}))

// Form store without its provider: pairKey + side selectors, spied actions.
vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { pairKey: string; side: MarginDirection; excludedVenues: never[] }) => unknown) =>
    selector({ pairKey: 'test-pair', side: mockSide.current, excludedVenues: [] }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

const SEARCH_LABEL = 'Search markets'

beforeEach(() => {
  mockGroups.current = DEFAULT_GROUPS
})

afterEach(() => {
  mockMarket.current = undefined
  mockSide.current = MarginDirection.LONG
  mockIsLoading.current = false
  mockMarketUnresolved.current = false
  mockMarketsError.current = undefined
  mockRefetch.mockClear()
  setMarginFormState.mockClear()
})

describe('MarginMarketSelector', () => {
  it('labels a direction-less short market as Short in the collapsed trigger', () => {
    const defaultMarket = getDefaultMarginMarket()
    mockMarket.current = { ...defaultMarket, collateral: defaultMarket.debt, debt: defaultMarket.collateral }
    const { getByText } = render(<MarginMarketSelector />)
    expect(getByText('Short')).toBeTruthy()
  })

  // MarginFormMarketsState owns the markets error surface; the collapsed trigger renders nothing
  // rather than stacking a second error box with a second retry beside it.
  it('renders nothing when the trigger cannot resolve a market', () => {
    mockMarketUnresolved.current = true
    mockMarketsError.current = new Error('boom')
    const { queryByTestId } = render(<MarginMarketSelector />)
    // The error surface is the header's alone — the in-modal list never renders this ID.
    expect(queryByTestId(TestID.MarginMarketsError)).toBeNull()
  })

  it('shows the venue ghost wired to the market venue in the collapsed trigger (Site A)', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    // Only the trigger renders a venue ghost at the pair step (pair rows carry none).
    const logos = getAllByTestId(TestID.MarginVenueLogo)
    expect(logos).toHaveLength(1)
    expect(logos[0]?.getAttribute('data-venue')).toBe('AAVE_V4')
  })

  it('renders one row per pair group on the selected side, labelled BASE / QUOTE', () => {
    const { getAllByTestId, getAllByText } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
    // The collapsed trigger also labels ETH / USDC, so the row is not the only match.
    expect(getAllByText('ETH / USDC').length).toBeGreaterThan(0)
    expect(getAllByText('cbBTC / USDC').length).toBeGreaterThan(0)
  })

  it('titles a short row with the base token name, never the stablecoin name', () => {
    mockSide.current = MarginDirection.SHORT
    const { getAllByTestId, getByText, queryByText } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(1)
    expect(getByText('Ethereum')).toBeTruthy()
    expect(queryByText('USD Coin')).toBeNull()
  })

  it('summarises a group by its best leverage, cheapest rate and venue count', () => {
    const { getByText, queryByText } = render(<MarginMarketSelector />)
    // ETH/USDC is 3x@420bps on MORPHO and 5x@510bps on AAVE_V3; cbBTC/USDC is one 4x venue at 380bps.
    expect(getByText('5x')).toBeTruthy()
    expect(queryByText('3x')).toBeNull()
    expect(getByText('4.2%')).toBeTruthy()
    expect(queryByText('5.1%')).toBeNull()
    expect(getByText('2 venues')).toBeTruthy()
    expect(getByText('1 venue')).toBeTruthy()
  })

  it('matches a pair by its unwrapped symbol, resolved name and slash-free pair string', () => {
    const { getAllByTestId, getByLabelText } = render(<MarginMarketSelector />)
    const search = getByLabelText(SEARCH_LABEL)
    for (const query of ['weth', 'eth', 'Ethereum', 'ethusdc', 'ETH / USDC']) {
      fireEvent.change(search, { target: { value: query } })
      expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(1)
    }
  })

  it('distinguishes a fruitless search from a side with no markets at all', () => {
    const { getByTestId, getByLabelText } = render(<MarginMarketSelector />)
    fireEvent.change(getByLabelText(SEARCH_LABEL), { target: { value: 'zzz' } })
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No markets found')
  })

  it('names the empty side rather than blaming the search when a side has no markets', () => {
    mockGroups.current = []
    const { getByTestId, rerender } = render(<MarginMarketSelector />)
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No long markets available')
    mockSide.current = MarginDirection.SHORT
    rerender(<MarginMarketSelector />)
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No short markets available')
  })

  it('reads as loading, not as empty, before the markets query resolves', () => {
    mockGroups.current = []
    mockIsLoading.current = true
    const { getByTestId, queryByTestId } = render(<MarginMarketSelector />)
    expect(getByTestId(TestID.MarginMarketsLoading)).toBeTruthy()
    expect(queryByTestId(TestID.MarginMarketsEmpty)).toBeNull()
  })

  // The whole row list in one artifact: name, BASE / QUOTE, headline leverage, cheapest rate and the
  // venue-count affordance. A regression anywhere in the row composition moves this.
  it('renders the market list', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toMatchInlineSnapshot(`
      [
        "ETHUSDEthereumETH / USDC5x4.2%2 venues",
        "cbBUSDcbBTCcbBTC / USDC4x3.8%1 venue",
      ]
    `)
  })

  // Multi-venue groups no longer branch to a second step — there is only one, and it adopts the pair.
  it('adopts the pair from one tap, whatever the venue count', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: LONG_ETH_USDC.pairKey,
      paymentToken: undefined,
      side: MarginDirection.LONG,
    })
    // The two-venue group is the one that used to branch; nothing about it names a venue now.
    expect(LONG_ETH_USDC.pairs.length).toBeGreaterThan(1)
    expect(setMarginFormState).toHaveBeenCalledTimes(1)
  })

  it('writes the pair, never a venue: the allowlist is what routes, not the row that was tapped', () => {
    const { getAllByTestId, queryAllByTestId } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[1]!)
    expect(setMarginFormState).toHaveBeenCalledWith(expect.objectContaining({ pairKey: LONG_CBBTC_USDC.pairKey }))
    expect(setMarginFormState.mock.calls[0]?.[0]).not.toHaveProperty('venue')
    expect(queryAllByTestId(TestID.MarginVenueRow)).toHaveLength(0)
  })

  // D23: an exposure token listed against two counter tokens is two markets, and the selector may
  // never fold them into one row — the counter leg is what the user borrows.
  it('lists one row per counter token of a shared exposure token', () => {
    mockGroups.current = [LONG_ETH_USDC, LONG_ETH_USDT]
    const { getAllByTestId } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toMatchInlineSnapshot(`
      [
        "ETHUSDEthereumETH / USDC5x4.2%2 venues",
        "ETHUSDEthereumETH / USDT2x6.5%1 venue",
      ]
    `)
  })

  it('flips to the opposite-direction group of the same pair when the side changes', () => {
    const { getAllByTestId, rerender } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    expect(setMarginFormState).toHaveBeenCalledWith(expect.objectContaining({ pairKey: LONG_ETH_USDC.pairKey }))

    mockSide.current = MarginDirection.SHORT
    rerender(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    // A short's pairKey is the reversed pair, so the flip has to re-read the group, not reuse the key.
    expect(setMarginFormState).toHaveBeenLastCalledWith({
      pairKey: SHORT_ETH_USDC.pairKey,
      paymentToken: undefined,
      side: MarginDirection.SHORT,
    })
  })

  it('names the empty side rather than listing the other one when a pair has no opposite group', () => {
    mockGroups.current = [LONG_ETH_USDC]
    mockSide.current = MarginDirection.SHORT
    const { getByTestId, queryAllByTestId } = render(<MarginMarketSelector />)
    expect(queryAllByTestId(TestID.MarginPairRow)).toHaveLength(0)
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No short markets available')
  })

  it('writes side long for a long group', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[1]!)
    expect(setMarginFormState).toHaveBeenCalledWith(expect.objectContaining({ side: MarginDirection.LONG }))
  })

  it('writes the side from the group, not the pair', () => {
    mockSide.current = MarginDirection.SHORT
    // SHORT_ETH_USDC's only pair carries no `direction`, so reading the pair would write LONG.
    const { getAllByTestId } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    expect(setMarginFormState).toHaveBeenCalledWith(expect.objectContaining({ side: MarginDirection.SHORT }))
  })
})

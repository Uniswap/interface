import { act, fireEvent } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { PropsWithChildren } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket, type MarginPairGroup, type MarginTokenInfo } from '~/constants/margin'
import { marginTokenCurrencyId } from '~/features/margin/utils/marginCurrencies'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginMarketSelector } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { render } from '~/test-utils/render'

// Render Modal children inline so the market list is testable without the portal/animation machinery
// (same approach as SearchModal.test.tsx).
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: PropsWithChildren) => children,
}))

// Echo the venue prop; the venue→logo mapping itself is covered by MarginVenueLogo.test.tsx.
vi.mock('~/features/margin/components/MarginVenueLogo', () => ({
  MarginVenueLogo: ({ venue }: { venue: string }) => <div data-testid={TestID.MarginVenueLogo} data-venue={venue} />,
}))

// The side toggle reads the form store and the registry; stub it out so the list renders hermetically.
vi.mock('~/pages/Swap/Margin/components/MarginSideToggle', () => ({
  MarginSideToggle: () => null,
}))

// The shared network filter's own menu is covered by its tests; this suite drives the props it is given.
const { networkFilterProps } = vi.hoisted(() => ({
  networkFilterProps: {
    current: undefined as
      | {
          chainIds: UniverseChainId[]
          selectedChain: UniverseChainId | null
          onPressChain: (chainId: UniverseChainId | null) => void
        }
      | undefined,
  },
}))
vi.mock('uniswap/src/components/network/NetworkFilter/NetworkFilter', () => ({
  NetworkFilter: (props: NonNullable<typeof networkFilterProps.current>) => {
    networkFilterProps.current = props
    return null
  },
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
      availableBorrowLiquidity: '12300000000000',
    },
    {
      key: 'weth-usdc-AAVE_V3',
      debt: USDC,
      venue: 'AAVE_V3',
      direction: MarginDirection.LONG,
      lltvWad: '0',
      maxLeverage: 5,
      borrowRateBps: 510,
      availableBorrowLiquidity: '450000000000',
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
      availableBorrowLiquidity: '2500000000000000000',
    },
  ],
}

const {
  mockMarket,
  mockSide,
  mockExcludedVenues,
  mockGroups,
  mockIsLoading,
  mockMarketUnresolved,
  mockMarketsError,
  mockRefetch,
  mockMarkPrice,
  setMarginFormState,
} = vi.hoisted(() => ({
  // Per-test override for the collapsed trigger's market; defaults to a static AAVE_V4 market.
  mockMarket: { current: undefined as MarginMarket | undefined },
  // Filled in below: vi.hoisted runs before the MarginDirection import is bound.
  mockSide: {} as { current: MarginDirection },
  mockExcludedVenues: { current: [] as string[] },
  // Per-test registry. Defaults are filled in below, once the fixtures exist.
  mockGroups: { current: [] as MarginPairGroup[] },
  mockIsLoading: { current: false },
  // When true, PairHeaderButton's own getPairMarket(...) ?? markets.at(0) resolves to nothing —
  // exercises its independent guard regardless of what the pair list (`groups`) has.
  mockMarketUnresolved: { current: false },
  mockMarketsError: { current: undefined as unknown },
  mockRefetch: vi.fn(),
  // Per-test mark; undefined is a pair with no price yet.
  mockMarkPrice: { current: 2345.67 as number | undefined },
  // Hoisted so the spy identity is stable across renders and assertable.
  setMarginFormState: vi.fn(),
}))
mockSide.current = MarginDirection.LONG

const DEFAULT_GROUPS: MarginPairGroup[] = [LONG_ETH_USDC, LONG_CBBTC_USDC, SHORT_ETH_USDC]

vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
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

vi.mock('~/features/margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map([[normalizeCurrencyIdForMapLookup(marginTokenCurrencyId(USDC)), USDC_INFO]]),
}))

// Form store without its provider: pairKey + side selectors, spied actions.
vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (
    selector: (s: { pairKey: string; side: MarginDirection; excludedVenues: string[] }) => unknown,
  ) => selector({ pairKey: 'test-pair', side: mockSide.current, excludedVenues: mockExcludedVenues.current }),
  useMarginFormStoreActions: () => ({ setMarginFormState }),
}))

// Every pair shares one price feed in this suite; the figures only have to be pair-level and visible.
vi.mock('~/pages/Swap/Margin/chart/useMarginChartData', () => ({
  useMarginStats24h: () => ({ stats24h: { changePct: 2.5 }, markPrice: mockMarkPrice.current }),
}))

const SEARCH_PLACEHOLDER = 'Search tokens or pairs'

// Data API token categories: cbBTC is tagged "Majors" and WETH "DeFi", so each chip isolates one long row.
const CATEGORY_IDS_BY_ADDRESS: Record<string, string[]> = {
  [CBBTC.address.toLowerCase()]: ['majors'],
  // WETH is requested as native ETH (marginTokenCurrencyId), so the response is keyed by position only.
  native: ['defi'],
}
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: () => true,
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/tokens/useCurrencyInfo')>()),
  useRestTokensQuery: (currencyIds: string[], { select }: { select: (tokens: unknown[]) => unknown }) => ({
    data: select(
      currencyIds.map((id) => {
        const address = id.split('-')[1]?.toLowerCase() ?? ''
        return { categoryIds: CATEGORY_IDS_BY_ADDRESS[address] ?? CATEGORY_IDS_BY_ADDRESS.native }
      }),
    ),
  }),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories', () => ({
  useAllTokenCategories: () => ({
    categories: [
      { id: 'majors', name: 'Majors' },
      { id: 'defi', name: 'DeFi' },
      { id: 'meme', name: 'Meme' },
    ],
    isLoading: false,
  }),
}))
vi.mock('uniswap/src/features/tokenCategories/useCategoryOrder', () => ({
  useCategoryOrder: ({ categories }: { categories: unknown[] }) => categories,
}))

beforeEach(() => {
  mockGroups.current = DEFAULT_GROUPS
})

afterEach(() => {
  mockMarket.current = undefined
  mockMarkPrice.current = 2345.67
  mockSide.current = MarginDirection.LONG
  mockExcludedVenues.current = []
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

  it('renders one row per pair on the selected side', () => {
    const { getAllByTestId, getAllByText } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
    // The collapsed trigger also labels ETH / USDC, so the row is not the only match.
    expect(getAllByText('ETH / USDC').length).toBeGreaterThan(0)
    expect(getAllByText('cbBTC / USDC').length).toBeGreaterThan(0)
  })

  // The venue is routed, so a pair shows pair-level figures only. Its leverage ceiling is the one
  // venue-derived figure.
  it('renders no venue economics or venue identity on a pair', () => {
    const { getAllByTestId, queryAllByTestId } = render(<MarginMarketSelector />)
    const rowText = getAllByTestId(TestID.MarginPairRow)
      .map((row) => row.textContent)
      .join('|')
    for (const venueFigure of ['3x', '4.2%', '5.1%', 'LLTV', 'Morpho', 'Aave', '12.3M']) {
      expect(rowText).not.toContain(venueFigure)
    }
    // Only the collapsed trigger carries a venue logo.
    expect(queryAllByTestId(TestID.MarginVenueLogo)).toHaveLength(1)
  })

  it('renders the pair list', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toMatchInlineSnapshot(`
      [
        "ETHUSDETH / USDC$2,345.672.50%5x",
        "cbBUSDcbBTC / USDC$2,345.672.50%4x",
      ]
    `)
  })

  it('shows a pair’s max leverage as the highest among the venues not opted out', () => {
    const firstRowLeverage = (rows: HTMLElement[]): string | undefined => rows[0]?.textContent?.match(/\d+x/)?.[0]
    const { getAllByTestId, unmount } = render(<MarginMarketSelector />)
    // AAVE_V3 (5x) over MORPHO (3x).
    expect(firstRowLeverage(getAllByTestId(TestID.MarginPairRow))).toBe('5x')
    unmount()
    mockExcludedVenues.current = ['AAVE_V3']
    const excluded = render(<MarginMarketSelector />)
    expect(firstRowLeverage(excluded.getAllByTestId(TestID.MarginPairRow))).toBe('3x')
  })

  it('lists a pair only while at least one of its venues is not opted out', () => {
    mockExcludedVenues.current = ['MORPHO']
    const { getAllByTestId } = render(<MarginMarketSelector />)
    // cbBTC/USDC trades on Morpho alone; ETH/USDC keeps AAVE_V3.
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toEqual([
      expect.stringContaining('ETH / USDC'),
    ])
  })

  it('offers the network the markets are fetched for, All networks by default, and filters rows by it', () => {
    const { getAllByTestId, getByTestId } = render(<MarginMarketSelector />)
    expect(networkFilterProps.current?.chainIds).toEqual([MARGIN_CHAIN_ID])
    expect(networkFilterProps.current?.selectedChain).toBeNull()
    act(() => networkFilterProps.current?.onPressChain(MARGIN_CHAIN_ID))
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
    act(() => networkFilterProps.current?.onPressChain(UniverseChainId.Base))
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No markets found')
    act(() => networkFilterProps.current?.onPressChain(null))
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
  })

  it('titles a short row with the base leg, never the stablecoin first', () => {
    mockSide.current = MarginDirection.SHORT
    const { getAllByTestId } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(1)
    expect(getAllByTestId(TestID.MarginPairRow)[0]?.textContent).toContain('ETH / USDC')
  })

  it('matches a pair by its unwrapped symbol, resolved name and slash-free pair string', () => {
    const { getAllByTestId, getByPlaceholderText } = render(<MarginMarketSelector />)
    const search = getByPlaceholderText(SEARCH_PLACEHOLDER)
    for (const query of ['weth', 'eth', 'Ethereum', 'ethusdc', 'ETH / USDC']) {
      fireEvent.change(search, { target: { value: query } })
      expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(1)
    }
  })

  // Venues aren't listed here, so a venue name finds nothing rather than pairs with no venue shown.
  it('does not match pairs by venue name', () => {
    const { getByTestId, getByPlaceholderText } = render(<MarginMarketSelector />)
    fireEvent.change(getByPlaceholderText(SEARCH_PLACEHOLDER), { target: { value: 'morpho' } })
    expect(getByTestId(TestID.MarginMarketsEmpty).textContent).toBe('No markets found')
  })

  it('offers a chip per backend category the listed tokens carry, and narrows by it', () => {
    const { getAllByTestId, getByText, queryByText } = render(<MarginMarketSelector />)
    // Meme is a real category, but no listed token carries it.
    expect(queryByText('Meme')).toBeNull()
    fireEvent.click(getByText('Majors'))
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toEqual([
      expect.stringContaining('cbBTC / USDC'),
    ])
    fireEvent.click(getByText('DeFi'))
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toEqual([
      expect.stringContaining('ETH / USDC'),
    ])
    fireEvent.click(getByText('All'))
    expect(getAllByTestId(TestID.MarginPairRow)).toHaveLength(2)
  })

  it('narrows by the long-asset filter, naming the chosen token on the trigger', () => {
    const { getAllByTestId, getByTestId } = render(<MarginMarketSelector />)
    expect(getByTestId(TestID.MarginAssetFilter).textContent).toBe('Long asset')
    expect(getByTestId(TestID.MarginDebtFilter).textContent).toBe('Debt asset')
    fireEvent.click(getByTestId(TestID.MarginAssetFilter))
    // AdaptiveDropdown also mounts a hidden measuring copy of the menu; the first is the live one.
    fireEvent.click(getAllByTestId(`${TestID.MarginAssetFilterOptionPrefix}${CBBTC.address.toLowerCase()}`)[0]!)
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toEqual([
      expect.stringContaining('cbBTC / USDC'),
    ])
    expect(getByTestId(TestID.MarginAssetFilter).textContent).toContain('cbBTC')
  })

  it('distinguishes a fruitless search from a side with no markets at all', () => {
    const { getByTestId, getByPlaceholderText } = render(<MarginMarketSelector />)
    fireEvent.change(getByPlaceholderText(SEARCH_PLACEHOLDER), { target: { value: 'zzz' } })
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

  // D23: an exposure token listed against two counter tokens is two markets, and the selector may
  // never fold them into one row — the counter leg is what the user borrows.
  it('lists one row per counter token of a shared exposure token', () => {
    mockGroups.current = [LONG_ETH_USDC, LONG_ETH_USDT]
    const { getAllByTestId } = render(<MarginMarketSelector />)
    expect(getAllByTestId(TestID.MarginPairRow).map((row) => row.textContent)).toEqual([
      expect.stringContaining('ETH / USDC'),
      expect.stringContaining('ETH / USDT'),
    ])
  })

  it('labels each column once in the list header, with no venue-only columns', () => {
    const { getAllByText, queryByText } = render(<MarginMarketSelector />)
    for (const label of ['Pair', 'Mark price', '24h', 'Max lev.']) {
      expect(getAllByText(label)).toHaveLength(1)
    }
    expect(queryByText('Borrow rate')).toBeNull()
    expect(queryByText('Liquidity')).toBeNull()
  })

  it('selects the pair and its direction in one write, clearing any venue pin', () => {
    const { getAllByTestId } = render(<MarginMarketSelector />)
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    expect(setMarginFormState).toHaveBeenCalledTimes(1)
    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: LONG_ETH_USDC.pairKey,
      paymentToken: undefined,
      side: MarginDirection.LONG,
      pinnedVenue: undefined,
    })
  })

  it('writes a short pair’s reversed key and side from the group, not the pair', () => {
    mockSide.current = MarginDirection.SHORT
    const { getAllByTestId } = render(<MarginMarketSelector />)
    // SHORT_ETH_USDC's only pair carries no `direction`, so reading the pair would write LONG.
    fireEvent.click(getAllByTestId(TestID.MarginPairRow)[0]!)
    expect(setMarginFormState).toHaveBeenCalledWith({
      pairKey: SHORT_ETH_USDC.pairKey,
      paymentToken: undefined,
      side: MarginDirection.SHORT,
      pinnedVenue: undefined,
    })
  })
})

import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { usablePriceX18, usableWireAmount } from '~/pages/Swap/Margin/marginFormat'
import {
  resolvePinnedMarkPriceX18,
  resolveRoutedMarkPriceX18,
  resolveVenueMarket,
} from '~/pages/Swap/Margin/marginRoutedMarket'

const MORPHO_MARKET = getDefaultMarginMarket()
const AAVE_MARKET: MarginMarket = { ...MORPHO_MARKET, key: 'weth-usdc-AAVE_V3', venue: 'AAVE_V3' }

const MORPHO_MARK = `${3000n * 10n ** 18n}`
const AAVE_MARK = `${3300n * 10n ** 18n}`

// Stands in for useMarginMarkets: exact on a venue, and — the trap this module exists for — falling
// back to the pair's FIRST market when given none.
function getMarketByTokens({ venue }: { venue?: MarginVenue }): MarginMarket | undefined {
  return venue ? [MORPHO_MARKET, AAVE_MARKET].find((m) => m.venue === venue) : MORPHO_MARKET
}

function getLive(key: string | undefined): { markPriceX18: string } | undefined {
  const marks: Record<string, string> = { [MORPHO_MARKET.key]: MORPHO_MARK, [AAVE_MARKET.key]: AAVE_MARK }
  return key && marks[key] ? { markPriceX18: marks[key] } : undefined
}

function quoteRoutedTo(venue: MarginVenue | undefined): MarginQuoteResponse {
  return {
    legs: venue ? [{ venue }] : [],
  } as unknown as MarginQuoteResponse
}

describe('resolveVenueMarket', () => {
  it('resolves the named venue’s own market', () => {
    expect(resolveVenueMarket({ market: MORPHO_MARKET, venue: 'AAVE_V3', getMarketByTokens })).toBe(AAVE_MARKET)
  })

  // The whole point of the guard: getMarketByTokens would hand back the pair's first market, which is a
  // venue the quote never routed to.
  it('returns undefined rather than the pair’s first market when no venue is named', () => {
    expect(resolveVenueMarket({ market: MORPHO_MARKET, venue: undefined, getMarketByTokens })).toBeUndefined()
  })

  it('returns undefined when the registry has no entry for the venue', () => {
    expect(resolveVenueMarket({ market: MORPHO_MARKET, venue: 'COMPOUND_V3', getMarketByTokens })).toBeUndefined()
  })
})

describe('resolveRoutedMarkPriceX18', () => {
  // The invariant both the price-impact row and the liquidation-distance figure rest on: the mark comes
  // from the venue the quote ROUTED to, never the form's pair-first market. Reading the wrong one would
  // compare a fill against another venue's oracle.
  it('reads the mark of the venue the quote routed to, not the form’s market', () => {
    const { priceX18: markPriceX18 } = resolveRoutedMarkPriceX18({
      market: MORPHO_MARKET,
      quote: quoteRoutedTo('AAVE_V3'),
      getMarketByTokens,
      getLive,
      marketsUpdatedAt: 0,
    })
    expect(markPriceX18).toBe(AAVE_MARK)
    expect(markPriceX18).not.toBe(MORPHO_MARK)
  })

  it('is undefined on a registry miss, so the figures hide instead of substituting another mark', () => {
    expect(
      resolveRoutedMarkPriceX18({
        market: MORPHO_MARKET,
        quote: quoteRoutedTo('COMPOUND_V3'),
        getMarketByTokens,
        getLive,
        marketsUpdatedAt: 0,
      }).priceX18,
    ).toBeUndefined()
  })

  it('is undefined when the venue publishes a zero mark, so the fill-price fallback still runs', () => {
    const zeroLive = (key: string | undefined): { markPriceX18: string } | undefined =>
      key === MORPHO_MARKET.key ? { markPriceX18: '0' } : undefined
    expect(
      resolveRoutedMarkPriceX18({
        market: MORPHO_MARKET,
        quote: quoteRoutedTo('MORPHO'),
        getMarketByTokens,
        getLive: zeroLive,
        marketsUpdatedAt: 0,
      }).priceX18,
    ).toBeUndefined()
  })

  it('is undefined for a quote carrying no legs', () => {
    expect(
      resolveRoutedMarkPriceX18({
        market: MORPHO_MARKET,
        quote: quoteRoutedTo(undefined),
        getMarketByTokens,
        getLive,
        marketsUpdatedAt: 0,
      }).priceX18,
    ).toBeUndefined()
  })
})

describe('usablePriceX18', () => {
  it('passes a positive figure through', () => {
    expect(usablePriceX18(MORPHO_MARK)).toBe(MORPHO_MARK)
  })

  // The trap: `'0'` is a truthy STRING, so every `mark ? … : fallback` reads it as present and then
  // renders or divides by zero. The wire sends it for a venue whose oracle read failed.
  it.each(['0', '-1', '', undefined, 'not-a-number'])('rejects the unusable mark %p', (value) => {
    expect(usablePriceX18(value)).toBeUndefined()
  })
})

describe('usableWireAmount', () => {
  it('decodes a raw wire amount at the given decimals', () => {
    expect(usableWireAmount({ raw: `${2n * 10n ** 18n}`, decimals: 18 })).toBe(2)
    expect(usableWireAmount({ raw: '53000000000000000', decimals: 18 })).toBe(0.053)
  })

  // BigInt throws a SyntaxError on a non-integer string, which takes a whole block down mid-render
  // rather than hiding one row — and BigInt('') is 0n, so the zero sentinel arrives looking real.
  it.each(['1.5', '', '1e18', 'nope', '0', '-1'])('rejects the unusable amount %p', (raw) => {
    expect(usableWireAmount({ raw, decimals: 18 })).toBeUndefined()
  })
})

describe('the markets-poll freshness bound', () => {
  const LIVE_MARK = `${4000n * 10n ** 18n}`
  const liveMark = (key: string | undefined): { markPriceX18: string } | undefined =>
    key === MORPHO_MARKET.key ? { markPriceX18: LIVE_MARK } : undefined
  const args = { market: MORPHO_MARKET, quote: quoteRoutedTo('MORPHO'), getMarketByTokens, getLive: liveMark }

  // getLive serves the last SUCCESSFUL poll with no age limit, so a stalled refetch keeps serving a
  // pre-drift mark — and every figure priced off it reads SAFER when it lags. Required on BOTH
  // resolvers so a new consumer cannot silently opt out.
  it('serves a fresh mark and withholds an aged one', () => {
    expect(resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: Date.now() })).toEqual({
      priceX18: LIVE_MARK,
      isStale: false,
    })
    expect(resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: Date.now() - 10 * 60_000 })).toEqual({
      priceX18: undefined,
      isStale: true,
    })
  })

  // The whole point of returning the pair: an exempted caller gets the aged price AND the flag that
  // makes rendering it honest, so the two cannot be obtained apart from one another.
  it('reports the poll as stale even when allowStale served the mark anyway', () => {
    expect(
      resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: Date.now() - 10 * 60_000, allowStale: true }),
    ).toEqual({ priceX18: LIVE_MARK, isStale: true })
  })

  // 0 means "never fetched", which must NOT suppress — nothing should hide before the first load.
  it('treats a never-fetched poll as fresh', () => {
    expect(resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: 0 }).priceX18).toBeDefined()
  })

  // The impact exception had NO direct test, so swapping either impact call site back to the bounded
  // resolver kept every suite green — which is how the review sheet ended up on the bounded one while
  // the docstring justifying the exception named that very surface.
  // `allowStale` is the price-impact exception, and it must be the LONGER path: default-off means a
  // caller that forgets it honours the bound, and the opt-out is greppable at the call site rather
  // than hidden in a function name that also took fewer arguments than the safe one.
  it('honours the bound by default and exempts only an explicit allowStale', () => {
    const aged = Date.now() - 10 * 60_000
    expect(resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: aged }).priceX18).toBeUndefined()
    expect(resolveRoutedMarkPriceX18({ ...args, marketsUpdatedAt: aged, allowStale: true }).priceX18).toBeDefined()

    const pinned = { pinnedMarketExact: MORPHO_MARKET, getLive: liveMark }
    expect(resolvePinnedMarkPriceX18({ ...pinned, marketsUpdatedAt: aged }).priceX18).toBeUndefined()
    expect(resolvePinnedMarkPriceX18({ ...pinned, marketsUpdatedAt: aged, allowStale: true }).priceX18).toBeDefined()
  })

  it('applies the same bound to the pinned-venue resolver', () => {
    const pinned = { pinnedMarketExact: MORPHO_MARKET, getLive: liveMark }
    expect(resolvePinnedMarkPriceX18({ ...pinned, marketsUpdatedAt: Date.now() })).toEqual({
      priceX18: LIVE_MARK,
      isStale: false,
    })
    expect(resolvePinnedMarkPriceX18({ ...pinned, marketsUpdatedAt: Date.now() - 10 * 60_000 })).toEqual({
      priceX18: undefined,
      isStale: true,
    })
  })
})

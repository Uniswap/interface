import { FetchError, TradingApi } from '@universe/api'
import {
  marginRequestActionKey,
  marginRequestPositionId,
  type MarginQuoteRequest,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  isSameMarginQuoteSubject,
  isTransientMarginQuoteError,
  marginQuoteParamsFromKey,
  marginQuoteRetry,
  MARGIN_QUOTE_QUERY_KEY,
} from 'uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery'

const fetchErrorWithStatus = (status: number): FetchError =>
  new FetchError({ response: new Response(null, { status }) })

const BASE_REQUEST = {
  positionChainId: 1,
  exposureToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  counterToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  direction: TradingApi.MarginDirection.LONG,
  swapper: '0x00000000000000000000000000000000000000A1',
}

// These exercise shape predicates over the request union, so a minimal fixture (one action key +
// envelope) is clearer than a fully-wire-legal request the builder would produce. The cast is the
// file's established pattern for that; the predicates read only the fields asserted here.
function req(partial: object): MarginQuoteRequest {
  return partial as unknown as MarginQuoteRequest
}

describe('marginRequestActionKey', () => {
  it('names the single key a request carries', () => {
    expect(marginRequestActionKey(req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['MORPHO'] } }))).toBe(
      'open',
    )
    expect(marginRequestActionKey(req({ ...BASE_REQUEST, close: { positionId: '3' } }))).toBe('close')
    expect(
      marginRequestActionKey(
        req({
          ...BASE_REQUEST,
          withdrawEquityAndDecreaseLeverage: { positionId: '3', leverageTarget: '2' },
        }),
      ),
    ).toBe('withdrawEquityAndDecreaseLeverage')
  })

  it('is undefined when no key rides the request', () => {
    expect(marginRequestActionKey(req(BASE_REQUEST))).toBeUndefined()
  })
})

describe('marginRequestPositionId', () => {
  it('reads the id out of whichever action key carries it', () => {
    expect(marginRequestPositionId(req({ ...BASE_REQUEST, close: { positionId: '3' } }))).toBe('3')
    expect(
      marginRequestPositionId(
        req({
          ...BASE_REQUEST,
          withdrawEquityAndDecreaseLeverage: { positionId: '7', leverageTarget: '2' },
        }),
      ),
    ).toBe('7')
  })

  it('reports absent for an open, which has no position yet, and for a keyless request', () => {
    expect(
      marginRequestPositionId(req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['MORPHO'] } })),
    ).toBeUndefined()
    expect(marginRequestPositionId(req(BASE_REQUEST))).toBeUndefined()
  })
})

describe('isTransientMarginQuoteError', () => {
  it('retries 5xx on every key', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(500), actionKey: 'open' })).toBe(true)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(503), actionKey: 'addEquity' })).toBe(true)
  })

  it('retries network/non-HTTP failures on every key', () => {
    expect(isTransientMarginQuoteError({ error: new Error('network down'), actionKey: 'open' })).toBe(true)
    expect(isTransientMarginQuoteError({ error: new TypeError('network down'), actionKey: 'close' })).toBe(true)
  })

  it('retries 422 on open only — the routing 422 conflates upstream timeouts with no-liquidity', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(422), actionKey: 'open' })).toBe(true)
  })

  it('never retries 422 on a manage key — there it is a business rejection', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(422), actionKey: 'close' })).toBe(false)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(422), actionKey: 'increaseLeverage' })).toBe(false)
  })

  it('retries rate-limit/timeout signals on a manage key', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(429), actionKey: 'withdrawEquity' })).toBe(true)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(408), actionKey: 'withdrawEquity' })).toBe(true)
  })

  // open's retry set is a superset of manage's, not an alternative to it: the action key selects the
  // 422 policy only, so infra failures retry on every key.
  it('retries rate-limit/timeout signals on open too', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(429), actionKey: 'open' })).toBe(true)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(408), actionKey: 'open' })).toBe(true)
  })

  it('never retries terminal 4xx on either arm', () => {
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(400), actionKey: 'open' })).toBe(false)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(404), actionKey: 'open' })).toBe(false)
    expect(isTransientMarginQuoteError({ error: fetchErrorWithStatus(400), actionKey: 'addEquity' })).toBe(false)
  })
})

describe('marginQuoteRetry', () => {
  it('caps retries at 2', () => {
    const retry = marginQuoteRetry({ actionKey: 'open' })
    const transient = fetchErrorWithStatus(500)
    expect(retry(0, transient)).toBe(true)
    expect(retry(1, transient)).toBe(true)
    expect(retry(2, transient)).toBe(false)
  })

  it('never retries terminal errors regardless of failureCount', () => {
    expect(marginQuoteRetry({ actionKey: 'open' })(0, fetchErrorWithStatus(400))).toBe(false)
    expect(marginQuoteRetry({ actionKey: 'addEquity' })(0, fetchErrorWithStatus(422))).toBe(false)
  })
})

describe('marginQuoteParamsFromKey', () => {
  const request = req({ ...BASE_REQUEST, open: { leverageTarget: '2' } })

  it('reads the request back off a key this module built', () => {
    expect(marginQuoteParamsFromKey([...MARGIN_QUOTE_QUERY_KEY, request])).toBe(request)
  })

  it('reports absent for the skipToken key, whose request is undefined', () => {
    expect(marginQuoteParamsFromKey([...MARGIN_QUOTE_QUERY_KEY, undefined])).toBeUndefined()
  })

  // The point of the helper: a key of another shape reports absent rather than handing back whatever
  // sits last. Callers use it to decide whether the PREVIOUS quote may be bridged, so guessing wrong
  // would bridge one position's amounts onto another's decimals.
  it('reports absent for a key of another shape rather than guessing', () => {
    expect(marginQuoteParamsFromKey([...MARGIN_QUOTE_QUERY_KEY])).toBeUndefined()
    expect(marginQuoteParamsFromKey([...MARGIN_QUOTE_QUERY_KEY, 'v2', request])).toBeUndefined()
  })
})

// The axes are the whole contract: each one, changed alone, must refuse the bridge. A single missing
// comparison silently re-denominates a live figure for the refetch window.
describe('isSameMarginQuoteSubject', () => {
  const base = req({
    ...BASE_REQUEST,
    close: { positionId: '3' },
    walletToken: '0xpay',
    walletChainId: 1,
    swapConfig: { slippageTolerance: 0.5 },
  })

  it('admits a bridge when only the action amount moved', () => {
    // The amount rides the action object now and is NOT a subject axis (the key is); same wallet,
    // same position → still the same subject.
    const previous = req({
      ...BASE_REQUEST,
      addEquity: { positionId: '3', amount: '1' },
      walletToken: '0xpay',
      walletChainId: 1,
    })
    const next = req({
      ...BASE_REQUEST,
      addEquity: { positionId: '3', amount: '2' },
      walletToken: '0xpay',
      walletChainId: 1,
    })
    expect(isSameMarginQuoteSubject({ previous, next })).toBe(true)
  })

  // The bridge exists FOR this edit: a leverage retarget re-keys the query on every slider step, and
  // refusing it would unmount the size/leverage block mid-drag. Comparing the action KEY rather than the
  // whole action object is what keeps this admitted while the denomination axis stays closed.
  it('admits a bridge across a leverage retarget within the same action key', () => {
    const previous = req({ ...BASE_REQUEST, increaseLeverage: { positionId: '3', leverageTarget: '2' } })
    const next = req({ ...BASE_REQUEST, increaseLeverage: { positionId: '3', leverageTarget: '3' } })
    expect(isSameMarginQuoteSubject({ previous, next })).toBe(true)
  })

  // A deposit's rail is denominated in the PAYMENT token, a withdrawal's in COLLATERAL — the action key
  // is the only thing that says which, so bridging across it shows one action's figures under another's.
  it('refuses a bridge across a change of action key', () => {
    const previous = req({
      ...BASE_REQUEST,
      addEquity: { positionId: '3', amount: '1' },
      walletToken: '0xpay',
      walletChainId: 1,
    })
    const next = req({
      ...BASE_REQUEST,
      withdrawEquity: { positionId: '3', amount: '1' },
      walletToken: '0xpay',
      walletChainId: 1,
    })
    expect(isSameMarginQuoteSubject({ previous, next })).toBe(false)
  })

  it.each([
    ['chain', { positionChainId: 8453 }],
    ['account', { swapper: '0x00000000000000000000000000000000000000B2' }],
    ['position', { close: { positionId: '99' } }],
    ['exposure leg', { exposureToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' }],
    ['counter leg', { counterToken: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' }],
    ['direction', { direction: TradingApi.MarginDirection.SHORT }],
    ['wallet token', { walletToken: '0xother' }],
    ['wallet chain', { walletChainId: 8453 }],
  ])('refuses a bridge across a %s change', (_axis, override) => {
    const next = req({
      ...BASE_REQUEST,
      close: { positionId: '3' },
      walletToken: '0xpay',
      walletChainId: 1,
      swapConfig: { slippageTolerance: 0.5 },
      ...override,
    })
    expect(isSameMarginQuoteSubject({ previous: base, next })).toBe(false)
  })

  // The venue allowlist rides inside the `open` action, so it needs an open-shaped pair rather than the
  // position-shaped `base` the table above uses. Toggling a venue re-keys the query, and bridging would
  // keep the excluded venue's LLTV-derived rows on screen until the new fetch lands.
  it('refuses a bridge across a venue-allowlist change', () => {
    const previous = req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['MORPHO', 'AAVE_V3'] } })
    const next = req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['MORPHO'] } })
    expect(isSameMarginQuoteSubject({ previous, next })).toBe(false)
  })

  // The allowlist is a SET: the same venues in a different order are the same subject, and blanking the
  // form for a re-ordering would be a regression rather than the protection above.
  it('still bridges when the same venues arrive in a different order', () => {
    const previous = req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['MORPHO', 'AAVE_V3'] } })
    const next = req({ ...BASE_REQUEST, open: { leverageTarget: '2', venues: ['AAVE_V3', 'MORPHO'] } })
    expect(isSameMarginQuoteSubject({ previous, next })).toBe(true)
  })

  it('refuses when either side has no params to compare', () => {
    expect(isSameMarginQuoteSubject({ previous: undefined, next: base })).toBe(false)
    expect(isSameMarginQuoteSubject({ previous: base, next: undefined })).toBe(false)
  })
})

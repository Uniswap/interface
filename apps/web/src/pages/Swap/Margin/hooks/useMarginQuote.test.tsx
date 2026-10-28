import { act, renderHook } from '@testing-library/react'
import { TradingApi } from '@universe/api'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginActivePosition,
  type MarginQuoteRequest,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  isSameMarginQuoteSubject,
  MARGIN_QUOTE_QUERY_KEY,
} from 'uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery'
import { MarginDirection, type MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, MARGIN_DEBOUNCE_MS } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useMarginQuote, type UseMarginQuoteParams } from '~/pages/Swap/Margin/hooks/useMarginQuote'

const { mockUseMarginQuoteQuery } = vi.hoisted(() => ({ mockUseMarginQuoteQuery: vi.fn() }))

vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/useMarginQuoteQuery')>()),
  useMarginQuoteQuery: mockUseMarginQuoteQuery,
}))

const SWAPPER = '0x00000000000000000000000000000000000000A1'
const POSITION_ID = '3'
const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity

const NATIVE_PAYMENT_TOKEN: MarginPaymentToken = {
  address: MARGIN_NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  decimals: 18,
  isNative: true,
  chainId: MARGIN_CHAIN_ID,
}
const ERC20_PAYMENT_TOKEN: MarginPaymentToken = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  isNative: false,
  chainId: MARGIN_CHAIN_ID,
}

// Leverage pinned low so every target used below (2x+) is an unambiguous increase — these tests care
// about request SHAPE, not where the increase/decrease boundary falls.
function positionFixture(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId: POSITION_ID,
    direction: MarginDirection.LONG,
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    size: '1000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt: '1700000000',
    legs: [
      {
        venue: MARKET.venue,
        subId: POSITION_ID,
        account: '0x000000000000000000000000000000000000000A',
        debt: '500000000',
      },
    ],
    isTradable: true,
    equity: '1000000000000000000',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1000000000000000000000',
    buffer: '500000000000000000',
    healthFactor: '1500000000000000000',
    maxWithdrawable: '400000000000000000',
    leverage: '1.5',
    ...overrides,
  }
}

function baseProps(overrides: Partial<UseMarginQuoteParams> = {}): UseMarginQuoteParams {
  return {
    position: positionFixture(),
    market: MARKET,
    swapper: SWAPPER,
    action: 'adjust',
    funding: { kind: 'none' },
    paymentToken: NATIVE_PAYMENT_TOKEN,
    targetLeverageX18: undefined,
    slippageToleranceBps: 50,
    ...overrides,
  }
}

function lastParams(): MarginQuoteRequest | undefined {
  const call = mockUseMarginQuoteQuery.mock.calls.at(-1) as [{ params?: MarginQuoteRequest }] | undefined
  return call?.[0].params
}

// The request is a discriminated union; these read a member's fields through `in` narrowing (the
// production accessors do the same) so the new wire shape is asserted without a cast. walletToken /
// walletChainId ride the envelope, the equity amount rides the action object, and swapConfig carries
// only the pay-in swap's slippage.
type Params = MarginQuoteRequest | undefined
function walletTokenOf(p: Params): string | undefined {
  return p && 'walletToken' in p ? p.walletToken : undefined
}
function walletChainIdOf(p: Params): number | undefined {
  return p && 'walletChainId' in p ? p.walletChainId : undefined
}
function railSlippageOf(p: Params): number | undefined {
  return p && 'swapConfig' in p ? p.swapConfig.slippageTolerance : undefined
}
function leverageLegToleranceOf(p: Params): number | undefined {
  return p && 'slippageTolerance' in p ? p.slippageTolerance : undefined
}
// The equity magnitude moved by whichever amount-bearing key the request carries.
function fundingAmountOf(p: Params): string | undefined {
  if (!p) {
    return undefined
  }
  if ('open' in p) {
    return p.open.amount
  }
  if ('addEquity' in p) {
    return p.addEquity.amount
  }
  if ('withdrawEquity' in p) {
    return p.withdrawEquity.amount
  }
  if ('addEquityAndIncreaseLeverage' in p) {
    return p.addEquityAndIncreaseLeverage.amount
  }
  if ('addEquityAndDecreaseLeverage' in p) {
    return p.addEquityAndDecreaseLeverage.amount
  }
  if ('withdrawEquityAndIncreaseLeverage' in p) {
    return p.withdrawEquityAndIncreaseLeverage.amount
  }
  if ('withdrawEquityAndDecreaseLeverage' in p) {
    return p.withdrawEquityAndDecreaseLeverage.amount
  }
  return undefined
}
function leverageTargetOf(p: Params): string | undefined {
  if (!p) {
    return undefined
  }
  if ('increaseLeverage' in p) {
    return p.increaseLeverage.leverageTarget
  }
  if ('decreaseLeverage' in p) {
    return p.decreaseLeverage.leverageTarget
  }
  if ('addEquityAndIncreaseLeverage' in p) {
    return p.addEquityAndIncreaseLeverage.leverageTarget
  }
  if ('addEquityAndDecreaseLeverage' in p) {
    return p.addEquityAndDecreaseLeverage.leverageTarget
  }
  if ('withdrawEquityAndIncreaseLeverage' in p) {
    return p.withdrawEquityAndIncreaseLeverage.leverageTarget
  }
  if ('withdrawEquityAndDecreaseLeverage' in p) {
    return p.withdrawEquityAndDecreaseLeverage.leverageTarget
  }
  return undefined
}

type PlaceholderFn = (previous: unknown, previousQuery?: { queryKey: readonly unknown[] }) => unknown

function lastPlaceholderData(): PlaceholderFn {
  const call = mockUseMarginQuoteQuery.mock.calls.at(-1) as [{ placeholderData: PlaceholderFn }] | undefined
  if (!call) {
    throw new Error('the query was never called')
  }
  return call[0].placeholderData
}

beforeEach(() => {
  vi.useFakeTimers()
  mockUseMarginQuoteQuery.mockReset()
  mockUseMarginQuoteQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isPlaceholderData: false,
    error: null,
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useMarginQuote — combined-key debouncing', () => {
  it('never mixes a new funding amount with a stale target leverage (or vice versa)', () => {
    const L1 = '2000000000000000000' // 2x
    const L2 = '2500000000000000000' // 2.5x
    const { rerender } = renderHook((props: UseMarginQuoteParams) => useMarginQuote(props), {
      initialProps: baseProps({
        funding: { kind: 'deposit', paymentAmountRaw: 'AAA' },
        targetLeverageX18: L1,
      }),
    })
    expect(fundingAmountOf(lastParams())).toBe('AAA')
    expect(leverageTargetOf(lastParams())).toBe('2')

    // Change funding only; leverage untouched.
    rerender(baseProps({ funding: { kind: 'deposit', paymentAmountRaw: 'BBB' }, targetLeverageX18: L1 }))
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS - 100)
    })
    // Change leverage before the first edit's debounce would have fired — this MUST reset the shared
    // timer. A per-field debounce (funding and leverage on separate timers) would let funding's timer
    // expire on schedule below, landing 'BBB' paired with the stale L1 in one request.
    rerender(baseProps({ funding: { kind: 'deposit', paymentAmountRaw: 'BBB' }, targetLeverageX18: L2 }))
    act(() => {
      vi.advanceTimersByTime(100)
    })
    // 100ms after the first edit's original 300ms mark, 100ms after the second edit. Neither value
    // should have landed yet: proof the two fields share one clock, not two.
    expect(fundingAmountOf(lastParams())).toBe('AAA')
    expect(leverageTargetOf(lastParams())).toBe('2')

    // Now clear the full delay from the SECOND edit.
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS - 100)
    })
    expect(fundingAmountOf(lastParams())).toBe('BBB')
    expect(leverageTargetOf(lastParams())).toBe('2.5')
  })

  it('exposes the combined key for visible-matches-submitted checks', () => {
    const { result, rerender } = renderHook((props: UseMarginQuoteParams) => useMarginQuote(props), {
      initialProps: baseProps({ funding: { kind: 'withdraw', withdrawAmountRaw: '10' }, targetLeverageX18: '20' }),
    })
    expect(result.current.debouncedKey).toBe(`withdraw:10:20:${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`)

    rerender(baseProps({ funding: { kind: 'none' }, targetLeverageX18: undefined }))
    expect(result.current.isDebouncing).toBe(true)
    // Still the old key until the debounce settles.
    expect(result.current.debouncedKey).toBe(`withdraw:10:20:${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`)

    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(result.current.debouncedKey).toBe(`none:::${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`)
    expect(result.current.isDebouncing).toBe(false)
  })

  // Add margin types its amount directly in payment-token units, so switching USDC->WETH with an
  // unchanged "100" produces an identical funding amount. Without the token in the key,
  // visible-matches-submitted goes blind and the CTA is armed against the wrong token's quote.
  it('re-keys and refetches when only the payment token changes', () => {
    const funding = { kind: 'deposit', paymentAmountRaw: '100' } as const
    const { result, rerender } = renderHook((props: UseMarginQuoteParams) => useMarginQuote(props), {
      initialProps: baseProps({ funding, paymentToken: NATIVE_PAYMENT_TOKEN }),
    })
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(result.current.debouncedKey).toBe(`deposit:100::${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`)

    rerender(baseProps({ funding, paymentToken: ERC20_PAYMENT_TOKEN }))
    expect(result.current.isDebouncing).toBe(true)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(result.current.debouncedKey).toBe(
      `deposit:100::${ERC20_PAYMENT_TOKEN.address}:${ERC20_PAYMENT_TOKEN.chainId}`,
    )
    expect(walletTokenOf(lastParams())).toBe(ERC20_PAYMENT_TOKEN.address)
  })

  // The request must be built ENTIRELY from debounced values. Pairing a debounced amount with a live
  // token fires an interim quote for {new token, old amount} — real, non-placeholder data, which
  // useLastGoodQuote then latches and renders if the correct fetch errors.
  it('never pairs a new payment token with the previous amount mid-debounce', () => {
    const funding = { kind: 'deposit', paymentAmountRaw: '100' } as const
    const { rerender } = renderHook((props: UseMarginQuoteParams) => useMarginQuote(props), {
      initialProps: baseProps({ funding, paymentToken: NATIVE_PAYMENT_TOKEN }),
    })
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    rerender(baseProps({ funding, paymentToken: ERC20_PAYMENT_TOKEN }))
    // Mid-debounce: the request must still describe the OLD token, not a mix.
    expect(walletTokenOf(lastParams())).toBe(MARGIN_NATIVE_TOKEN_ADDRESS)
    expect(walletChainIdOf(lastParams())).toBe(NATIVE_PAYMENT_TOKEN.chainId)
    act(() => {
      vi.advanceTimersByTime(MARGIN_DEBOUNCE_MS)
    })
    expect(walletTokenOf(lastParams())).toBe(ERC20_PAYMENT_TOKEN.address)
    expect(walletChainIdOf(lastParams())).toBe(ERC20_PAYMENT_TOKEN.chainId)
  })
})

describe('useMarginQuote — request mapping per funding kind', () => {
  it('deposit-only: maps native sentinel + amount + chain under addEquity, forbids slippageTolerance', () => {
    renderHook(() =>
      useMarginQuote(
        baseProps({
          funding: { kind: 'deposit', paymentAmountRaw: '500000000000000000' },
          paymentToken: NATIVE_PAYMENT_TOKEN,
        }),
      ),
    )
    const params = lastParams()
    // The wire fans the rail out: walletToken/walletChainId on the envelope, the amount on the action
    // key (addEquity.amount), and only the pay-in swap's slippage on swapConfig.
    expect(params).toMatchObject({
      swapper: SWAPPER,
      exposureToken: MARKET.collateral.address,
      counterToken: MARKET.debt.address,
      direction: MarginDirection.LONG,
      walletToken: MARGIN_NATIVE_TOKEN_ADDRESS,
      walletChainId: MARGIN_CHAIN_ID,
      swapConfig: { slippageTolerance: 0.5 },
      addEquity: { positionId: POSITION_ID, amount: '500000000000000000' },
    })
    // addEquity carries no leverage swap — the leverage-leg tolerance bounds nothing on it.
    expect(params).not.toHaveProperty('slippageTolerance')
    expect(params).not.toHaveProperty('withdrawEquity')
    expect(params).not.toHaveProperty('increaseLeverage')
  })

  it('deposit: maps a non-native payment token to its own address (no sentinel)', () => {
    renderHook(() =>
      useMarginQuote(
        baseProps({
          funding: { kind: 'deposit', paymentAmountRaw: '500000000' },
          paymentToken: ERC20_PAYMENT_TOKEN,
        }),
      ),
    )
    expect(walletTokenOf(lastParams())).toBe(ERC20_PAYMENT_TOKEN.address)
    expect(walletChainIdOf(lastParams())).toBe(ERC20_PAYMENT_TOKEN.chainId)
  })

  it('withdraw-only: sends the amount in COLLATERAL units, and forbids the leverage-leg tolerance', () => {
    renderHook(() =>
      useMarginQuote(baseProps({ funding: { kind: 'withdraw', withdrawAmountRaw: '250000000000000000' } })),
    )
    const params = lastParams()
    // The wire names the pay/receive token at the envelope on a withdrawal too (the server discards it
    // and reads the amount as collateral — the action key decides the denomination), the amount on the
    // action key, and leaves only the rail's own tolerance on swapConfig.
    expect(params).toMatchObject({
      walletToken: MARGIN_NATIVE_TOKEN_ADDRESS,
      walletChainId: MARGIN_CHAIN_ID,
      swapConfig: { slippageTolerance: 0.5 },
      withdrawEquity: { positionId: POSITION_ID, amount: '250000000000000000' },
    })
    expect(fundingAmountOf(params)).toBe('250000000000000000')
    expect(leverageLegToleranceOf(params)).toBeUndefined()
    expect(params).not.toHaveProperty('addEquity')
  })

  it('leverage-only: funding none + a real target builds an increaseLeverage request', () => {
    renderHook(() => useMarginQuote(baseProps({ funding: { kind: 'none' }, targetLeverageX18: '3000000000000000000' })))
    const params = lastParams()
    expect(params).toMatchObject({ increaseLeverage: { positionId: POSITION_ID, leverageTarget: '3' } })
    expect(params).not.toHaveProperty('swapConfig')
    expect(params).not.toHaveProperty('walletToken')
    expect(params).not.toHaveProperty('withdrawEquity')
    // The leverage leg DOES swap here, so its tolerance is required.
    expect(leverageLegToleranceOf(params)).toBeDefined()
  })
})

describe('useMarginQuote — gating', () => {
  // The dispatcher's oneof has no key for "nothing changed" — a preview-mode quote (server maxes with
  // no submittable action) no longer exists on the wire; the modal's ceilings now read straight off the
  // position/market rows instead of a quote.
  it('nothing set: no action key is representable, so params stay undefined', () => {
    renderHook(() => useMarginQuote(baseProps()))
    expect(lastParams()).toBeUndefined()
  })

  it('empty positionId on the position: params undefined (disabled)', () => {
    renderHook(() =>
      useMarginQuote(
        baseProps({
          funding: { kind: 'deposit', paymentAmountRaw: '1' },
          position: positionFixture({ positionId: '' }),
        }),
      ),
    )
    expect(lastParams()).toBeUndefined()
  })

  it('no swapper: params undefined (disabled)', () => {
    renderHook(() =>
      useMarginQuote(baseProps({ funding: { kind: 'deposit', paymentAmountRaw: '1' }, swapper: undefined })),
    )
    expect(lastParams()).toBeUndefined()
  })
})

// The close path used to be its own hook over its own query; these cases are new — the merge is the
// first time close and adjust share a request builder, and `close` is the one action key that must
// ignore both axes entirely.
describe('useMarginQuote — close', () => {
  function closeProps(overrides: Partial<UseMarginQuoteParams> = {}): UseMarginQuoteParams {
    return {
      position: positionFixture(),
      market: MARKET,
      swapper: SWAPPER,
      action: 'close',
      slippageToleranceBps: 50,
      ...overrides,
    }
  }

  it('names the position only, and binds the exit swap with the leverage-leg tolerance', () => {
    renderHook(() => useMarginQuote(closeProps()))
    const params = lastParams()
    expect(params).toMatchObject({
      swapper: SWAPPER,
      exposureToken: MARKET.collateral.address,
      counterToken: MARKET.debt.address,
      direction: MarginDirection.LONG,
      slippageTolerance: 0.5,
      // close pays out through a swap, so it names the payout token (the long's collateral) + a rail.
      walletToken: MARKET.collateral.address,
      walletChainId: MARGIN_CHAIN_ID,
      swapConfig: { slippageTolerance: 0.5 },
      close: { positionId: POSITION_ID },
    })
    expect(fundingAmountOf(params)).toBeUndefined()
    expect(params).not.toHaveProperty('withdrawEquity')
  })

  // `close` names itself — it is not resolved off the equity/leverage axes, so a modal that happens
  // to hold a dirty funding or leverage value can never turn a close into a composite.
  it('resolves to close even with funding and a leverage target set', () => {
    renderHook(() =>
      useMarginQuote(
        closeProps({
          funding: { kind: 'deposit', paymentAmountRaw: '500000000000000000' },
          paymentToken: NATIVE_PAYMENT_TOKEN,
          targetLeverageX18: '3000000000000000000',
        }),
      ),
    )
    const params = lastParams()
    expect(params).toMatchObject({ close: { positionId: POSITION_ID } })
    expect(params).not.toHaveProperty('addEquityAndIncreaseLeverage')
  })

  // The debt-free close: the modal fetches its own quote at confirm instead, so the polled query must
  // stay off rather than firing a request the panel is not showing.
  it('enabled: false disables the query outright', () => {
    renderHook(() => useMarginQuote(closeProps({ enabled: false })))
    expect(lastParams()).toBeUndefined()
  })

  it('empty positionId: params undefined (disabled)', () => {
    renderHook(() => useMarginQuote(closeProps({ position: positionFixture({ positionId: '' }) })))
    expect(lastParams()).toBeUndefined()
  })

  it('no swapper: params undefined (disabled)', () => {
    renderHook(() => useMarginQuote(closeProps({ swapper: undefined })))
    expect(lastParams()).toBeUndefined()
  })

  // A close names no payment token, so both token segments stay empty — the key still has all five
  // positions, which is what keeps the positional split safe for every action.
  it('keys on empty payment segments', () => {
    const { result } = renderHook(() => useMarginQuote(closeProps()))
    expect(result.current.debouncedKey).toBe('none::::')
  })

  it('flips direction legs for a SHORT position', () => {
    renderHook(() => useMarginQuote(closeProps({ position: positionFixture({ direction: MarginDirection.SHORT }) })))
    expect(lastParams()).toMatchObject({
      direction: MarginDirection.SHORT,
      exposureToken: MARKET.debt.address,
      counterToken: MARKET.collateral.address,
    })
  })
})

describe('useMarginQuote — query result passthrough', () => {
  it('forwards data/loading/fetching/placeholder/error from the underlying query', () => {
    const quote = { requestId: 'r1' } as unknown as ReturnType<typeof useMarginQuote>['quote']
    const error = new Error('boom')
    mockUseMarginQuoteQuery.mockReturnValue({
      data: quote,
      isLoading: true,
      isFetching: true,
      isPlaceholderData: true,
      error,
    })
    const { result } = renderHook(() => useMarginQuote(baseProps()))
    expect(result.current.quote).toBe(quote)
    expect(result.current.isQuoteLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)
    expect(result.current.isPlaceholderData).toBe(true)
    expect(result.current.quoteError).toBe(error)
  })
})

// The bridge keeps the before/after rows populated across a param change, so what it refuses to
// carry is the whole guarantee: every field below is one the amounts are denominated against.
describe('useMarginQuote — placeholder bridge', () => {
  const PREVIOUS_QUOTE = { requestId: 'previous' }

  function bridgeProps(): UseMarginQuoteParams {
    return { position: positionFixture(), market: MARKET, swapper: SWAPPER, action: 'close', slippageToleranceBps: 50 }
  }

  function bridge(previousParams: Partial<MarginQuoteRequest>): unknown {
    renderHook(() => useMarginQuote(bridgeProps()))
    const params = lastParams()
    if (!params) {
      throw new Error('no params were built')
    }
    return lastPlaceholderData()(PREVIOUS_QUOTE, {
      queryKey: [...MARGIN_QUOTE_QUERY_KEY, { ...params, ...previousParams }],
    })
  }

  it('bridges the previous quote when only the priced amount moved', () => {
    expect(bridge({})).toBe(PREVIOUS_QUOTE)
  })

  // The edit the bridge EXISTS for, and the one the shared predicate could most easily break: a leverage
  // retarget re-keys the query on every slider step, so refusing it would unmount the size/leverage
  // block mid-drag. `bridgeProps` uses a close action, where leverage is not representable, so this
  // asserts it directly on the action shape that carries one.
  it('bridges across a leverage retarget within the same action key', () => {
    renderHook(() => useMarginQuote(bridgeProps()))
    const params = lastParams()
    if (!params) {
      throw new Error('no params were built')
    }
    // Same envelope, same action key, only the leverage target differs — a pure increaseLeverage pair
    // (built without the close key, so the subject's position accessor reads a real member). The
    // envelope fields live on every union member (MarginQuoteRequestBase), so they read without a cast.
    const envelope = {
      positionChainId: MARGIN_CHAIN_ID,
      exposureToken: params.exposureToken,
      counterToken: params.counterToken,
      direction: params.direction,
      swapper: params.swapper,
      slippageTolerance: 0.5,
    }
    const previous = { ...envelope, increaseLeverage: { positionId: POSITION_ID, leverageTarget: '2' } }
    const next = { ...envelope, increaseLeverage: { positionId: POSITION_ID, leverageTarget: '3' } }
    expect(
      isSameMarginQuoteSubject({
        previous: previous as unknown as MarginQuoteRequest,
        next: next as unknown as MarginQuoteRequest,
      }),
    ).toBe(true)
  })

  it('drops it across an account switch', () => {
    expect(bridge({ swapper: '0x00000000000000000000000000000000000000B2' })).toBeUndefined()
  })

  // A modal instance reused across positions would otherwise render the previous position's amounts
  // against this market's decimals. The id rides INSIDE the action key, which is why the guard reads
  // it through marginRequestPositionId rather than off the envelope.
  it('drops it across a position switch', () => {
    expect(bridge({ close: { positionId: '99' } })).toBeUndefined()
  })

  // A token outside this market on either leg — the previous quote's amounts would be in its decimals.
  const FOREIGN_TOKEN = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' // WBTC, 8-dec

  // The axis the manage path was missing until the two predicates were merged: the payment leg is in
  // this hook's debounce key, so a deposit-funded adjust re-keys on a token switch and would otherwise
  // bridge a quote priced in the previous token's decimals into the before/after rows.
  it('drops it across a payment-token switch', () => {
    expect(bridge({ walletToken: ERC20_PAYMENT_TOKEN.address })).toBeUndefined()
  })

  it('drops it across a market or direction switch', () => {
    expect(bridge({ exposureToken: FOREIGN_TOKEN })).toBeUndefined()
    expect(bridge({ counterToken: FOREIGN_TOKEN })).toBeUndefined()
    expect(bridge({ direction: TradingApi.MarginDirection.SHORT })).toBeUndefined()
  })

  it('drops it when the key is not one this query built', () => {
    renderHook(() => useMarginQuote(bridgeProps()))
    expect(lastPlaceholderData()(PREVIOUS_QUOTE, { queryKey: ['some', 'other', 'shape', 'entirely'] })).toBeUndefined()
    expect(lastPlaceholderData()(PREVIOUS_QUOTE, undefined)).toBeUndefined()
  })
})

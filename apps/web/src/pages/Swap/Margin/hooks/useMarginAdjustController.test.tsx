import { renderHook } from '@testing-library/react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginActivePosition,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { useMarginAdjustController } from '~/pages/Swap/Margin/hooks/useMarginAdjustController'
import type { AdjustFunding } from '~/pages/Swap/Margin/hooks/useMarginQuote'
import type { AdjustLeverageMode } from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { MIN_LEVERAGE } from '~/pages/Swap/Margin/marginOpenButtonGate'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
// 2 WETH collateral / 2000 USDC debt @ $2000/ETH -> LTV 0.5 -> 2x leverage.
const CURRENT_LEVERAGE = '2'
// Default pay token is native ETH; the key's trailing segments are its wire sentinel + chain id.
const PAY = `${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`

const { SWAPPER, SUB_ID, mockUseMarginQuote, mockExecutePlan, mockUseIsPlanInFlight } = vi.hoisted(() => ({
  SWAPPER: '0x00000000000000000000000000000000000000A1',
  SUB_ID: '7',
  mockUseMarginQuote: vi.fn(),
  mockExecutePlan: vi.fn(),
  mockUseIsPlanInFlight: vi.fn(() => false),
}))

vi.mock('~/connection/hooks/useAccount', () => ({ useAccount: () => ({ address: SWAPPER }) }))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({ executePlan: mockExecutePlan }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

vi.mock('~/pages/Swap/Margin/hooks/useMarginPaymentTokenBalance', () => ({
  useMarginPaymentTokenBalance: () => ({ spendableBalanceRaw: '10000000000000000000', portfolioLoaded: true }),
}))

// Spreads the original: the controller also imports marginQuoteKey from this module, and a
// bare factory would strip it.
vi.mock('~/pages/Swap/Margin/hooks/useMarginQuote', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginQuote')>()),
  useMarginQuote: mockUseMarginQuote,
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { slippageToleranceBps: number }) => unknown) =>
    selector({ slippageToleranceBps: 50 }),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({ formatNumberOrString: ({ value }: { value: number }) => String(value) }),
}))

function positionFixture({
  legSubId = SUB_ID,
  ...overrides
}: Partial<MarginActivePosition> & { legSubId?: string } = {}): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId: SUB_ID,
    direction: MarginDirection.LONG,
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    size: '2000000000000000000',
    entryPrice: '2000000000000000000000',
    openedAt: '1700000000',
    legs: [
      {
        venue: MARKET.venue,
        subId: legSubId,
        account: '0x000000000000000000000000000000000000000A',
        debt: '2000000000',
      },
    ],
    isTradable: true,
    equity: '2000000000000000000',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1162790697674418604651',
    buffer: '400000000000000000',
    healthFactor: '1720000000000000000',
    maxWithdrawable: '500000000000000000',
    leverage: CURRENT_LEVERAGE,
    ...overrides,
  }
}

function quoteFixture(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'addEquityAndIncreaseLeverage',
    chainId: MARGIN_CHAIN_ID,
    swapper: SWAPPER,
    direction: MarginDirection.LONG,
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    positionId: SUB_ID,
    leverageTarget: CURRENT_LEVERAGE,
    display: {
      leverage: CURRENT_LEVERAGE,
      healthFactor: '1720000000000000000',
      liquidationPrice: '1162790697674418604651',
    },
    legs: [
      {
        venue: MARKET.venue,
        collateralToken: MARKET.collateral.address,
        debtToken: MARKET.debt.address,
        equityShare: '1000000000000000000',
        bounds: { increase: { expectedEquityDelta: '500000000000000000' } },
      },
    ],
    deadlineSuggestion: '1753290000',
    gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000', gasFeeUsd: '2000000000000000000' },
    ...overrides,
  }
}

function quoteResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    quote: undefined,
    quoteError: null,
    isQuoteLoading: false,
    isFetching: false,
    isDebouncing: false,
    isPlaceholderData: false,
    debouncedKey: `none:::${PAY}`,
    ...overrides,
  }
}

function renderController({
  funding = { kind: 'none' } as AdjustFunding,
  mode = { kind: 'drift' } as AdjustLeverageMode,
  position = positionFixture(),
  action = 'leverage' as MarginManageAction,
  market = MARKET,
}: {
  funding?: AdjustFunding
  mode?: AdjustLeverageMode
  position?: MarginActivePosition
  action?: MarginManageAction
  market?: MarginMarket
} = {}): ReturnType<typeof renderHook<ReturnType<typeof useMarginAdjustController>, unknown>> {
  return renderHook(() =>
    useMarginAdjustController({ position, market, funding, mode, action, onClose: vi.fn() }),
  ) as ReturnType<typeof renderHook<ReturnType<typeof useMarginAdjustController>, unknown>>
}

function lastQuoteArgs(): Record<string, unknown> {
  const calls = mockUseMarginQuote.mock.calls
  return calls[calls.length - 1]?.[0] as Record<string, unknown>
}

describe('useMarginAdjustController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockUseMarginQuote.mockReturnValue(quoteResult())
  })

  describe('mode -> targetLeverageX18', () => {
    it('sends no target in drift mode with no funding (preview mode)', () => {
      renderController()
      expect(lastQuoteArgs().targetLeverageX18).toBeUndefined()
    })

    it('sends no target in drift mode even with a deposit', () => {
      renderController({ funding: { kind: 'deposit', paymentAmountRaw: '500000000000000000' } })
      expect(lastQuoteArgs().targetLeverageX18).toBeUndefined()
      expect(lastQuoteArgs().funding).toEqual({ kind: 'deposit', paymentAmountRaw: '500000000000000000' })
    })

    it('sends no target for an explicit change inside ADJUST_MIN_LEVERAGE_DELTA', () => {
      renderController({ mode: { kind: 'explicit', value: 2.02 } })
      expect(lastQuoteArgs().targetLeverageX18).toBeUndefined()
    })

    it('sends the WAD target for an explicit change past the min delta', () => {
      renderController({ mode: { kind: 'explicit', value: 2.1 } })
      expect(lastQuoteArgs().targetLeverageX18).toBe('2100000000000000000')
    })
  })

  it('defaults the payment token when the caller names none', () => {
    renderController()
    expect(lastQuoteArgs().paymentToken).toBeDefined()
  })

  it('derives beforeLeverage from the position, not the quote', () => {
    mockUseMarginQuote.mockReturnValue(quoteResult({ quote: quoteFixture() }))
    const { result } = renderController({ position: positionFixture({ leverage: '2' }) })
    expect(result.current.beforeLeverage).toBe(2)
  })

  // "before" is projected-only-response territory now (gone from the quote entirely) — composed off
  // the position row, so it's available before any quote has ever resolved.
  it('beforeLeverage is available immediately, with no quote required', () => {
    const { result } = renderController()
    expect(result.current.beforeLeverage).toBe(2)
  })

  // A manage surface can never re-route, so the ceiling is the POSITION'S OWN venue's cap — never a
  // cross-venue max, which would offer leverage this venue cannot serve.
  it('peels maxWithdrawable off the position and the leverage cap off the pinned market', () => {
    const { result } = renderController({
      position: positionFixture({ maxWithdrawable: '500000000000000000' }),
      market: { ...MARKET, maxLeverage: 4 },
    })
    expect(result.current.maxWithdrawableRaw).toBe('500000000000000000')
    expect(result.current.cap).toBe(4)
  })

  // Off-registry markets carry no server-authored cap and none may be derived, so the slider collapses
  // to the backend floor rather than opening on a fabricated ceiling.
  it('falls back to MIN_LEVERAGE when the pinned market carries no cap', () => {
    const { result } = renderController({ market: { ...MARKET, maxLeverage: undefined } })
    expect(result.current.cap).toBe(MIN_LEVERAGE)
  })

  describe('confirm gate', () => {
    const DEPOSIT: AdjustFunding = { kind: 'deposit', paymentAmountRaw: '500000000000000000' }

    it('stays disabled with no quote yet', () => {
      mockUseMarginQuote.mockReturnValue(quoteResult({ debouncedKey: `deposit:500000000000000000::${PAY}` }))
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(true)
    })

    it('enables once a quote matches the debounced key', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: quoteFixture(), debouncedKey: `deposit:500000000000000000::${PAY}` }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(false)
    })

    // The isFetching->isPlaceholderData swap: a 15s background poll must not kill the CTA.
    it('ignores a background refetch when the key is unchanged and a quote is in hand', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: quoteFixture(), debouncedKey: `deposit:500000000000000000::${PAY}`, isFetching: true }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(false)
    })

    it('still blocks while a placeholder bridges a new key', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({
          quote: quoteFixture(),
          debouncedKey: `deposit:500000000000000000::${PAY}`,
          isFetching: true,
          isPlaceholderData: true,
        }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(true)
    })

    it('blocks while a quote error is showing, even with a quote in hand', () => {
      // React Query keeps `data` on error, so a failing same-key poll satisfies every other gate.
      mockUseMarginQuote.mockReturnValue(
        quoteResult({
          quote: quoteFixture(),
          quoteError: new Error('health floor'),
          debouncedKey: `deposit:500000000000000000::${PAY}`,
        }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(true)
      result.current.onConfirm()
      expect(mockExecutePlan).not.toHaveBeenCalled()
    })

    it('blocks when the visible funding has moved past what was priced', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: quoteFixture(), debouncedKey: `deposit:400000000000000000::${PAY}` }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      expect(result.current.confirmDisabled).toBe(true)
    })

    it('blocks a position with no subId', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: quoteFixture(), debouncedKey: `deposit:500000000000000000::${PAY}` }),
      )
      const { result } = renderController({ funding: DEPOSIT, position: positionFixture({ legSubId: '' }) })
      expect(result.current.confirmDisabled).toBe(true)
    })

    // Plan create is quote-only now — the whole quote is posted back verbatim, with nothing restated
    // that could drift (the old echo round-trip's job).
    it('submits a request built from the marginQuote verbatim', () => {
      const quote = quoteFixture()
      mockUseMarginQuote.mockReturnValue(quoteResult({ quote, debouncedKey: `deposit:500000000000000000::${PAY}` }))
      const { result } = renderController({ funding: DEPOSIT })
      result.current.onConfirm()
      expect(mockExecutePlan).toHaveBeenCalledTimes(1)
      const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
      expect(request).toEqual({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER, marginQuote: quote })
    })

    // The sheet outlives an account switch and marginQuoteKey carries no identity, so nothing else
    // catches a quote priced for a different wallet.
    it('refuses a quote priced for another account', () => {
      const foreign = quoteFixture({ swapper: '0x00000000000000000000000000000000000000ff' })
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: foreign, debouncedKey: `deposit:500000000000000000::${PAY}` }),
      )
      const { result } = renderController({ funding: DEPOSIT })
      result.current.onConfirm()
      expect(mockExecutePlan).not.toHaveBeenCalled()
    })

    // Every caller mints intent: 'ADJUST', so the originating action is the only thing that can name
    // the run afterwards (completion toast).
    it('forwards the caller action alongside the request', () => {
      mockUseMarginQuote.mockReturnValue(
        quoteResult({ quote: quoteFixture(), debouncedKey: `deposit:500000000000000000::${PAY}` }),
      )
      const { result } = renderController({ funding: DEPOSIT, action: 'add' })
      result.current.onConfirm()
      expect(mockExecutePlan).toHaveBeenCalledWith(expect.objectContaining({ action: 'add' }))
    })

    it('submits when an explicit leverage target is priced', () => {
      const target = '2100000000000000000'
      mockUseMarginQuote.mockReturnValue(
        quoteResult({
          quote: quoteFixture({ leverageTarget: '2.1' }),
          debouncedKey: `deposit:500000000000000000:${target}:${PAY}`,
        }),
      )
      const { result } = renderController({ funding: DEPOSIT, mode: { kind: 'explicit', value: 2.1 } })
      result.current.onConfirm()
      expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    })

    it('never submits while the gate is closed', () => {
      const { result } = renderController({ funding: DEPOSIT })
      result.current.onConfirm()
      expect(mockExecutePlan).not.toHaveBeenCalled()
    })
  })
})

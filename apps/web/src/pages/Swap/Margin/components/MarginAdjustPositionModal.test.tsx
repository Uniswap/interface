import { fireEvent, screen } from '@testing-library/react'
import { FetchError } from '@universe/api'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginActivePosition,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginAdjustPositionModal } from '~/pages/Swap/Margin/components/MarginAdjustPositionModal'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
// `render` runs setupi18n(), so the DOM carries resolved English — never the raw key.
// This is margin.adjustPosition.marginLabel resolved.
const MARGIN_LABEL = 'Margin'
// 2 WETH collateral / 2000 USDC debt @ $2000/ETH -> LTV 0.5 -> 2x leverage, 1 ETH live equity.
const CURRENT_LEVERAGE_X18 = '2000000000000000000'
// Default pay token is native ETH; the key's trailing segments are its wire sentinel + chain id.
const PAY = `${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`

// SWAPPER/SUB_ID live inside vi.hoisted (not just above it) because vi.mock/vi.hoisted factories are
// hoisted above ALL module-scope statements, including const declarations that textually precede them.
const {
  SWAPPER,
  SUB_ID,
  mockUseMarginQuote,
  mockExecutePlan,
  mockUseIsPlanInFlight,
  mockSpendableBalanceRaw,
  mockAccountAddress,
  NON_COLLATERAL_TOKEN,
} = vi.hoisted(() => {
  const SWAPPER = '0x00000000000000000000000000000000000000A1'
  const SUB_ID = '7'
  return {
    SWAPPER,
    SUB_ID,
    mockUseMarginQuote: vi.fn(),
    mockExecutePlan: vi.fn(),
    mockUseIsPlanInFlight: vi.fn(() => false),
    mockSpendableBalanceRaw: { current: undefined as string | undefined },
    // USDC on the margin chain — the market's DEBT leg, so paying with it is a real cross-token fund.
    NON_COLLATERAL_TOKEN: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      decimals: 6,
      isNative: false,
      chainId: 1,
    },
    mockAccountAddress: { current: SWAPPER as string | undefined },
  }
})

// Render Modal children inline so in-modal content is testable without portal/animation machinery
// (same approach as MarginMarketSelector.test.tsx).
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

// Real AmountInput needs text-width measurement + native-keyboard plumbing; swap for a plain input
// wired to value/onChangeText/onBlur so typing is a normal fireEvent.change/blur.
vi.mock('uniswap/src/components/AmountInput/AmountInput', () => ({
  AmountInput: (props: Record<string, unknown>) => (
    <input
      aria-label={props['aria-label'] as string | undefined}
      value={(props.value as string | undefined) ?? ''}
      onChange={(e) => (props.onChangeText as ((text: string) => void) | undefined)?.(e.target.value)}
      onBlur={() => (props.onBlur as (() => void) | undefined)?.()}
    />
  ),
}))

// The real Switch needs layout; swap for a deterministic passthrough so the toggle is a plain button
// (same approach as MarginChartSettings.test.tsx).
vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  function Switch({
    checked,
    onCheckedChange,
    testID,
  }: {
    checked?: boolean
    onCheckedChange?: (v: boolean) => void
    testID?: string
  }): JSX.Element {
    return (
      <button
        type="button"
        data-testid={testID}
        data-checked={String(Boolean(checked))}
        onClick={() => onCheckedChange?.(!checked)}
      />
    )
  }
  return { ...actual, Switch }
})

// Isolates the SUT from the slider's pointer-capture drag machinery (unavailable in jsdom): exposes
// the displayed value + a button that fires one onChange call, mirroring a completed drag.
vi.mock('~/pages/Swap/Margin/components/shared/MarginLeverageSlider', () => ({
  MarginLeverageSlider: ({ value, onChange }: { value: number; onChange: (next: number) => void }) => (
    <div>
      <span data-testid="slider-value">{value.toFixed(2)}</span>
      <button type="button" aria-label="drag-slider-to-5" onClick={() => onChange(5)}>
        drag
      </button>
    </div>
  ),
}))

// Sibling modal — its own hook surface (payment-token rows, markets) is out of scope here; F4 only
// needs to know it's mounted controlled.
vi.mock('~/pages/Swap/Margin/components/MarginPaymentTokenSelector', () => ({
  MarginPaymentTokenSelector: ({ onSelect }: { onSelect: (token: unknown) => void }) => (
    <button type="button" data-testid="pick-non-collateral" onClick={() => onSelect(NON_COLLATERAL_TOKEN)}>
      pick
    </button>
  ),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: mockAccountAddress.current }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({
    executePlan: mockExecutePlan,
    resumePlan: vi.fn(),
    retryCurrentStep: vi.fn(),
    restartPlan: vi.fn(),
  }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({
  useIsPlanInFlight: mockUseIsPlanInFlight,
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginPaymentTokenBalance', () => ({
  useMarginPaymentTokenBalance: () => ({
    spendableBalanceRaw: mockSpendableBalanceRaw.current,
    portfolioLoaded: true,
  }),
}))

// Spreads the original: the controller also imports marginQuoteKey from this module, and a
// bare factory would strip it.
vi.mock('~/pages/Swap/Margin/hooks/useMarginQuote', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginQuote')>()),
  useMarginQuote: mockUseMarginQuote,
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { slippageToleranceBps: number; excludedVenues: string[] }) => unknown) =>
    selector({ slippageToleranceBps: 50, excludedVenues: [] }),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: () => ({ price: undefined, isLoading: false }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => undefined,
  useCurrencyInfos: () => [],
}))

function positionFixture(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
  return {
    positionId: SUB_ID,
    status: 'ACTIVE',
    direction: MarginDirection.LONG,
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    size: '2000000000000000000', // 2 WETH
    entryPrice: '1850000000000000000000',
    openedAt: '1753000000',
    legs: [
      { venue: 'MORPHO', subId: SUB_ID, account: '0x000000000000000000000000000000000000000A', debt: '2000000000' },
    ],
    isTradable: true,
    equity: '2000000000', // 2000 USDC -> 1 WETH margin @ $2000/ETH
    leverage: '2', // 2 WETH collateral / 2000 USDC debt @ $2000/ETH -> LTV 0.5 -> 2x leverage
    oraclePrice: '2000000000000000000000', // $2000/ETH
    liquidationPrice: '1162790697674418604651',
    buffer: '400000000000000000',
    healthFactor: '1720000000000000000',
    maxWithdrawable: '500000000000000000',
    ...overrides,
  }
}

// PROJECTED-ONLY now — no before/after pair, just `display` as the after/current state.
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
    leverageTarget: '2',
    display: {
      leverage: '2',
      healthFactor: '1720000000000000000',
      liquidationPrice: '1162790697674418604651',
    },
    legs: [
      {
        venue: 'MORPHO',
        collateralToken: MARKET.collateral.address,
        debtToken: MARKET.debt.address,
        subId: SUB_ID,
        equityShare: '1000000000000000000',
        bounds: {},
      },
    ],
    deadlineSuggestion: '1753290000',
    gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000', gasFeeUsd: '2000000000000000000' },
    ...overrides,
  }
}

function mockQuoteResult(
  overrides: Partial<ReturnType<typeof baseQuoteResult>> = {},
): ReturnType<typeof baseQuoteResult> {
  return { ...baseQuoteResult(), ...overrides }
}

function baseQuoteResult(): {
  quote: MarginQuoteResponse | undefined
  quoteError: Error | null
  isQuoteLoading: boolean
  isFetching: boolean
  isDebouncing: boolean
  isPlaceholderData: boolean
  debouncedKey: string
} {
  return {
    quote: undefined,
    quoteError: null,
    isQuoteLoading: false,
    isFetching: false,
    isDebouncing: false,
    isPlaceholderData: false,
    debouncedKey: `none::${CURRENT_LEVERAGE_X18}:${PAY}`,
  }
}

// A SHORT market's collateral IS the stable leg. The position fixture's exposure/counter assignment
// already reads correctly for a SHORT (venueTerms flips them by direction) — only the market differs.
const SHORT_MARKET = {
  ...MARKET,
  displaySymbol: 'USDC',
  collateral: MARKET.debt,
  debt: MARKET.collateral,
  direction: MarginDirection.SHORT,
} as typeof MARKET

function renderModal(
  overrides: Partial<MarginActivePosition> = {},
  market: typeof MARKET = MARKET,
): ReturnType<typeof render> {
  return render(
    <MarginAdjustPositionModal position={positionFixture(overrides)} market={market} isOpen onClose={vi.fn()} />,
  )
}

describe('MarginAdjustPositionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockAccountAddress.current = SWAPPER
    // Generous default so deposit scenarios aren't accidentally gated as insufficient-balance; the
    // balance hook itself is mocked (portfolioLoaded: true), so an undefined raw here would otherwise
    // read as "loaded portfolio, zero of this token" per hasInsufficientAddBalance's real semantics.
    mockSpendableBalanceRaw.current = '10000000000000000000'
    mockUseMarginQuote.mockReturnValue(mockQuoteResult())
  })

  afterEach(() => {
    mockAccountAddress.current = SWAPPER
  })

  it('renders the pair heading, margin section, and CTA', () => {
    renderModal()
    expect(screen.getByTestId(TestID.MarginModalTitle)).toHaveTextContent('Adjust position')
    expect(screen.getByLabelText(MARGIN_LABEL)).toHaveValue('1')
    expect(screen.getByTestId('margin-adjust-position-cta')).toBeInTheDocument()
  })

  // The selector is mocked, so nothing here selected a non-collateral token and the cross-token legs
  // this modal derives ran only in their same-token shape. `conversionCaption` is NOT covered here:
  // it needs a quote carrying bounds.increase.expectedEquityDelta, and this suite's quote fixture is
  // deliberately undefined by default.
  describe('paying with a non-collateral token', () => {
    it('compounds the slippage it shows, since the fund is a swap plus the open', () => {
      renderModal()
      fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
      // 0.5% on the swap and again on the open: (1.005)^2 - 1.
      expect(screen.getByText('0.5%')).toBeInTheDocument()
      fireEvent.click(screen.getByTestId('pick-non-collateral'))
      expect(screen.getByText('1.00%')).toBeInTheDocument()
      expect(screen.queryByText('0.5%')).not.toBeInTheDocument()
    })

    // The other half of the predicate: only a DEPOSIT compounds, because only it swaps before opening.
    // Without this, dropping `funding.kind === 'deposit'` would overstate slippage on a withdraw and
    // no test would go red.
    it('does not compound on a withdraw that kept the non-collateral pay token', () => {
      renderModal()
      fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '0.5' } })
      fireEvent.click(screen.getByTestId('pick-non-collateral'))
      expect(screen.getByText('0.5%')).toBeInTheDocument()
      expect(screen.queryByText('1.00%')).not.toBeInTheDocument()
    })

    // With the lock OFF and the slider untouched the mode is `drift`: no target is sent, the debt is
    // held constant, and a cross-token deposit is a single swap leg — the same request shape
    // MarginAddModal makes, which discloses the per-leg figure. Without the mode gate the two screens
    // quote different slippage for the identical route.
    it('does not compound in drift mode, so Add and Adjust agree on the same route', () => {
      renderModal()
      fireEvent.click(screen.getByTestId(TestID.MarginAdjustLockLeverage))
      fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
      fireEvent.click(screen.getByTestId('pick-non-collateral'))
      expect(screen.getByText('0.5%')).toBeInTheDocument()
      expect(screen.queryByText('1.00%')).not.toBeInTheDocument()
    })

    // vi.hoisted runs above the imports, so the fixture cannot read MARGIN_CHAIN_ID — pin them equal.
    // Off the margin chain, isPaymentTokenDifferentFromCollateral short-circuits on the chain rule and
    // these tests would pin compoundsSlippage through a branch other than the cross-token one.
    it('funds cross-token on the margin chain, not via the off-chain rule', () => {
      expect(NON_COLLATERAL_TOKEN.chainId).toBe(MARGIN_CHAIN_ID)
    })
  })

  // position.equity is COUNTER-token raw units; a LONG needs the oracle mark to reach collateral units.
  // With no usable mark the old fallback handed the counter-raw figure back AS collateral raw, so a
  // 0.5 WETH top-up was requested as ~1.5 WETH — the decimal gap between USDC and WETH, in real money.
  // LTV >= 1 means equity is gone, so this arm belongs to a position at or past liquidation rather than
  // to anything typed. For a LONG, a target equity of x gives ltvAfter = debt / (debt + x·mark), which
  // is strictly below 1 for any x > 0 — a withdrawal approaches the boundary asymptotically. (A target
  // of exactly 0 IS accepted — see parseMarginTargetRaw — but it lands ON the boundary, where the
  // result is a float coin flip, and `overMax` fences submission there regardless.) So the reachable
  // case is the position arriving that way itself. `toFixed` on the result wrote the literal string
  // "Infinity" into the field.
  describe('a drift projection on a position already at liquidation', () => {
    // 2 WETH against 4,000 USDC at $2,000 → equity 0, LTV exactly 1.
    const AT_LIQUIDATION = {
      equity: '0',
      legs: [
        {
          venue: 'MORPHO' as const,
          subId: SUB_ID,
          account: '0x000000000000000000000000000000000000000A',
          debt: '4000000000',
        },
      ],
    }

    it('renders ∞ rather than the literal string "Infinity"', () => {
      renderModal(AT_LIQUIDATION)
      fireEvent.click(screen.getByTestId('margin-adjust-position-lock-leverage'))
      expect((screen.getByLabelText('Leverage') as HTMLInputElement).value).toBe('∞')
    })

    // The claim the earlier fallback swallowed: substituting the position's current leverage here
    // renders the most dangerous state on this sheet as "nothing is changing".
    it('does not report it as the position current leverage', () => {
      renderModal(AT_LIQUIDATION)
      fireEvent.click(screen.getByTestId('margin-adjust-position-lock-leverage'))
      expect(screen.getByLabelText('Leverage')).not.toHaveValue('2.00')
    })
  })

  describe('a LONG the oracle cannot price', () => {
    // The field used to render live over a baseline the sheet had already called unknowable: typing
    // moved nothing (deltaE is forced to 0), the helper read "Current — · Min — · Max —", and Confirm
    // never armed — with nothing on screen saying why. Suppressed and explained now, the way Withdraw
    // and Change leverage already handle their own dead-control states.
    it('suppresses the margin field rather than leaving a live control over an unknowable baseline', () => {
      renderModal({ oraclePrice: '0' })
      expect(screen.queryByLabelText(MARGIN_LABEL)).not.toBeInTheDocument()
      expect(screen.queryByText(/Current — · Min — · Max —/)).not.toBeInTheDocument()
    })

    it('says why, instead of leaving a dead button with no explanation', () => {
      renderModal({ oraclePrice: '0' })
      expect(screen.getByText(/margin can’t be added or taken out/)).toBeInTheDocument()
    })

    it('refuses to submit with nothing changed', () => {
      renderModal({ oraclePrice: '0' })
      expect(screen.getByTestId('margin-adjust-position-cta')).toBeDisabled()
    })

    // The unpriceable mark is UNKNOWABLE, not insolvent: the readout falls back to what the position
    // holds rather than claiming liquidation off a missing oracle.
    it('reports the position leverage rather than ∞ when the mark is what is missing', () => {
      renderModal({ oraclePrice: '0' })
      expect(screen.getByLabelText('Leverage')).toHaveValue('2.00')
    })

    // The other half: a LEVERAGE-only adjust needs no mark, and the Change-leverage sheet performs
    // exactly that on this same position. Blanket-disabling Confirm here refused a valid action while
    // the slider under it quoted a real, priced projection.
    it('still allows a leverage-only change, which needs no mark', () => {
      renderModal({ oraclePrice: '0' })
      fireEvent.click(screen.getByLabelText('drag-slider-to-5'))
      // The leverage control is live and reports the dragged value — no equity baseline involved.
      expect(screen.getByTestId('slider-value')).toHaveTextContent('5.00')
      expect(screen.getByLabelText('Leverage')).toHaveValue('5.00')
    })

    // A SHORT's counter token IS its venue collateral, so it needs no mark and must stay usable. Pinned
    // against a SHORT-SHAPED market and on the exact value: with the LONG market's 18 decimals against
    // 6-decimal raw equity the prefill is 0.000000002, which `not.toHaveValue('')` happily accepts.
    it('leaves a SHORT usable, since its counter token is already the collateral', () => {
      renderModal({ direction: MarginDirection.SHORT, oraclePrice: '0' }, SHORT_MARKET)
      // equity 2000000000 at the collateral leg's 6 decimals.
      expect(screen.getByLabelText(MARGIN_LABEL)).toHaveValue('2000')
    })
  })

  // The button names the money movement rather than staying a generic "Adjust position": with nothing
  // changed it also carries the reason it is disabled, which no other surface was stating.
  describe('CTA names the action', () => {
    it('asks for a change while nothing has moved', () => {
      renderModal()
      expect(screen.getByTestId('margin-adjust-position-cta')).toHaveTextContent('Adjust margin or leverage')
    })

    it('names the deposit once the margin is raised', () => {
      renderModal()
      fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
      expect(screen.getByTestId('margin-adjust-position-cta')).toHaveTextContent('Adjust margin and deposit')
    })

    it('names the withdrawal once the margin is lowered', () => {
      renderModal()
      fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '0.5' } })
      expect(screen.getByTestId('margin-adjust-position-cta')).toHaveTextContent('Adjust margin and withdraw')
    })
  })

  it('untouched input: funding is none — no phantom deposit from the rounded pre-fill', () => {
    renderModal()
    expect(screen.getByText('No deposit or withdrawal needed')).toBeInTheDocument()
    expect(screen.queryByText('Deposit required')).not.toBeInTheDocument()
    expect(screen.queryByText('You’ll receive')).not.toBeInTheDocument()
    // Nothing to pay, so nothing to choose to pay it with.
    expect(screen.queryByLabelText('Pay with')).not.toBeInTheDocument()
  })

  // Margin and Leverage are the pair the user controls; the funding line is what follows from them, so
  // it sits after both cards rather than splitting them apart.
  it('orders the funding line after the leverage control, not between the two cards', () => {
    renderModal()
    const marginLabel = screen.getByText('Margin')
    const leverageLabel = screen.getByText('Leverage')
    const funding = screen.getByText('No deposit or withdrawal needed')
    const order = (a: HTMLElement, b: HTMLElement): boolean =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(order(marginLabel, leverageLabel)).toBe(true)
    expect(order(leverageLabel, funding)).toBe(true)
  })

  it('raising the margin input renders the deposit funding row', () => {
    renderModal()
    const marginInputEl = screen.getByLabelText(MARGIN_LABEL)
    fireEvent.change(marginInputEl, { target: { value: '1.5' } })
    expect(screen.getByText('Deposit required')).toBeInTheDocument()
    expect(screen.queryByText('No deposit or withdrawal needed')).not.toBeInTheDocument()
    // Native ETH is the default pay token on this market, and it IS the collateral -> exact passthrough.
    // Exact text, not a loose regex: the helper caption below ("Min 0.500 · Max 11.00 ETH") also
    // matches a wider /0\.5.*ETH/ pattern.
    expect(screen.getByText('0.500 ETH')).toBeInTheDocument()
  })

  it('lowering the margin input renders the withdraw funding row', () => {
    renderModal()
    const marginInputEl = screen.getByLabelText(MARGIN_LABEL)
    fireEvent.change(marginInputEl, { target: { value: '0.5' } })
    expect(screen.getByText('You’ll receive')).toBeInTheDocument()
    // The explainer line under it is gone — it only restated the label.
    expect(screen.queryByText(/returns funds to your wallet/i)).not.toBeInTheDocument()
    expect(screen.queryByText('No deposit or withdrawal needed')).not.toBeInTheDocument()
  })

  it('poll re-sync suppressed once dirty: a position update no longer overwrites a touched input', () => {
    const { rerender } = renderModal()
    const marginInputEl = screen.getByLabelText(MARGIN_LABEL)
    fireEvent.change(marginInputEl, { target: { value: '1.5' } })
    expect(marginInputEl).toHaveValue('1.5')

    // Simulate the 20s position poll landing with a changed equity (e.g. interest accrual).
    rerender(
      <MarginAdjustPositionModal
        position={positionFixture({ equity: '2200000000' })}
        market={MARKET}
        isOpen
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(MARGIN_LABEL)).toHaveValue('1.5')
  })

  it('pre-fill stays live while pristine (untouched): a position update re-syncs the displayed value', () => {
    const { rerender } = renderModal()
    expect(screen.getByLabelText(MARGIN_LABEL)).toHaveValue('1')

    // Equity rises from 2000 to 4000 USDC (debt unchanged) -> live margin rises from 1 ETH to 2 ETH.
    rerender(
      <MarginAdjustPositionModal
        position={positionFixture({ equity: '4000000000' })}
        market={MARKET}
        isOpen
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(MARGIN_LABEL)).toHaveValue('2')
  })

  it('lock leverage is ON by default and pins the slider/leverage input to current leverage', () => {
    renderModal()
    expect(screen.getByTestId('margin-adjust-position-lock-leverage')).toHaveAttribute('data-checked', 'true')
    expect(screen.getByTestId('slider-value')).toHaveTextContent('2.00')
    expect(screen.getByLabelText('Leverage')).toHaveValue('2.00')
  })

  it('dragging the slider unlocks leverage and shows the dragged value', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText('drag-slider-to-5'))
    expect(screen.getByTestId('margin-adjust-position-lock-leverage')).toHaveAttribute('data-checked', 'false')
    expect(screen.getByTestId('slider-value')).toHaveTextContent('5.00')
    expect(screen.getByLabelText('Leverage')).toHaveValue('5.00')
  })

  it('toggling lock back on snaps the slider back to current leverage', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText('drag-slider-to-5'))
    expect(screen.getByTestId('slider-value')).toHaveTextContent('5.00')

    fireEvent.click(screen.getByTestId('margin-adjust-position-lock-leverage'))
    expect(screen.getByTestId('margin-adjust-position-lock-leverage')).toHaveAttribute('data-checked', 'true')
    expect(screen.getByTestId('slider-value')).toHaveTextContent('2.00')
  })

  it('CTA disabled matrix: no change yet (untouched, locked) even with a settled quote', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `none::${CURRENT_LEVERAGE_X18}:${PAY}` }),
    )
    renderModal()
    expect(screen.getByTestId('margin-adjust-position-cta')).toBeDisabled()
  })

  it('CTA disabled matrix: no quote yet', () => {
    renderModal()
    const marginInputEl = screen.getByLabelText(MARGIN_LABEL)
    fireEvent.change(marginInputEl, { target: { value: '1.5' } })
    expect(screen.getByTestId('margin-adjust-position-cta')).toBeDisabled()
  })

  it('CTA disabled matrix: no connected account', () => {
    mockAccountAddress.current = undefined
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture(),
        debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
      }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
    expect(screen.getByTestId('margin-adjust-position-cta')).toBeDisabled()
  })

  it('CTA disabled matrix: a plan already in flight', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture(),
        debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
      }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
    expect(screen.getByTestId('margin-adjust-position-cta')).toBeDisabled()
  })

  it('CTA enabled once a deposit is derived, matches the debounced key, and a quote is in hand', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture(),
        debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
      }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
    expect(screen.getByTestId('margin-adjust-position-cta')).not.toBeDisabled()
  })

  it('onConfirm builds a create request from the quote and closes the modal', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture(),
        debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
      }),
    )
    const onClose = vi.fn()
    render(<MarginAdjustPositionModal position={positionFixture()} market={MARKET} isOpen onClose={onClose} />)
    fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '1.5' } })
    fireEvent.click(screen.getByTestId('margin-adjust-position-cta'))

    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    // Plan create is quote-only now — no restated payment/leverage fields, no echo to build.
    expect(request).toMatchObject({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER })
    expect(request).toHaveProperty('marginQuote')
    expect(request).not.toHaveProperty('paymentToken')
    expect(request).not.toHaveProperty('paymentAmount')
    expect(request).not.toHaveProperty('withdrawAmount')
    expect(request).not.toHaveProperty('intent')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onConfirm builds a create request from the quote for a withdraw too', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture({ action: 'withdrawEquity' }),
        debouncedKey: `withdraw:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
      }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(MARGIN_LABEL), { target: { value: '0.5' } })
    fireEvent.click(screen.getByTestId('margin-adjust-position-cta'))

    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    expect(request).toMatchObject({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER })
    expect(request).toHaveProperty('marginQuote')
    expect(request).not.toHaveProperty('paymentToken')
    expect(request).not.toHaveProperty('paymentAmount')
  })

  describe('loading cue while stale, no layout shift', () => {
    // mycelium's Flex compiles `opacity={0.5}` to the uniwind class `opacity-[0.5]` (replacing
    // Tamagui's `_opacity-0--5`); getComputedStyle is stubbed in jsdom, so assert the class.
    function isDimmed(element: HTMLElement): boolean {
      return element.className.includes('opacity-[0.5]')
    }
    function ctaIsSpinning(): boolean {
      // mycelium's Spore button renders its loading spinner as <svg class="sbtn-spin"> (replacing
      // Tamagui's SpinningLoader `.RotateElement`).
      return screen.getByTestId('margin-adjust-position-cta').querySelector('.sbtn-spin') !== null
    }

    it('renders a fixed-height skeleton before any quote (or latched one) exists, and no before/after block yet', () => {
      mockUseMarginQuote.mockReturnValue(mockQuoteResult({ isQuoteLoading: true }))
      renderModal()
      expect(screen.getByTestId('margin-adjust-before-after-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('margin-adjust-before-after-block')).not.toBeInTheDocument()
    })

    it('a background refetch (isFetching, not placeholder) does not dim the before/after rows or spin the CTA', () => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: quoteFixture(), isFetching: true, isPlaceholderData: false }),
      )
      renderModal()
      expect(isDimmed(screen.getByTestId('margin-adjust-before-after-block'))).toBe(false)
      expect(ctaIsSpinning()).toBe(false)
    })

    it('dims (and spins the CTA) through debounce and placeholder-bridging, then clears once settled', () => {
      mockUseMarginQuote.mockReturnValue(mockQuoteResult({ quote: quoteFixture(), isDebouncing: true }))
      const { rerender } = renderModal()
      expect(isDimmed(screen.getByTestId('margin-adjust-before-after-block'))).toBe(true)
      expect(ctaIsSpinning()).toBe(true)

      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: quoteFixture(), isDebouncing: false, isPlaceholderData: true }),
      )
      rerender(<MarginAdjustPositionModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
      expect(isDimmed(screen.getByTestId('margin-adjust-before-after-block'))).toBe(true)
      expect(ctaIsSpinning()).toBe(true)

      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: quoteFixture(), isDebouncing: false, isPlaceholderData: false }),
      )
      rerender(<MarginAdjustPositionModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
      expect(isDimmed(screen.getByTestId('margin-adjust-before-after-block'))).toBe(false)
      expect(ctaIsSpinning()).toBe(false)
    })

    it('a quote error keeps the last-good before/after rows mounted (dimmed) instead of unmounting them', () => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: quoteFixture(),
          debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
        }),
      )
      const { rerender } = renderModal()
      expect(screen.getByTestId('margin-adjust-before-after-block')).toBeInTheDocument()

      // The next debounced request 422s — RQ v5 drops keepPreviousData on error, so `quote` reverts to
      // undefined even though the modal has something latched from the render above.
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: new Error('boom'),
          debouncedKey: `deposit:500000000000000000:${CURRENT_LEVERAGE_X18}:${PAY}`,
        }),
      )
      rerender(<MarginAdjustPositionModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)

      // T3 owns the error copy itself (untouched here) — this asserts today's real copy renders
      // alongside the latched rows; update the string if/when T3 changes it.
      expect(screen.getByText('Couldn’t fetch a quote. Try again.')).toBeInTheDocument()
      // Still mounted — the latched last-good quote, dimmed, not gone.
      expect(screen.getByTestId('margin-adjust-before-after-block')).toBeInTheDocument()
      expect(isDimmed(screen.getByTestId('margin-adjust-before-after-block'))).toBe(true)
    })
  })

  describe('quote error surfacing (T3)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    function fetchErrorWith({ errorCode, detail }: { errorCode?: string; detail?: string }): FetchError {
      return new FetchError({ response: new Response(null, { status: 422 }), data: { errorCode, detail } })
    }

    it('renders localized, per-reason copy for a known errorCode instead of the generic string', () => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: fetchErrorWith({
            errorCode: 'MARGIN_ADJUST_HEALTH_FLOOR',
            detail: 'Adjust would leave the position below the near-liquidation health floor',
          }),
        }),
      )
      renderModal()
      expect(
        screen.getByText(
          'This leverage would move the position too close to liquidation — lower the leverage or add margin.',
        ),
      ).toBeInTheDocument()
      expect(screen.queryByText('Couldn’t fetch a quote. Try again.')).not.toBeInTheDocument()
      // Never the raw BE detail — it leaks the wire field name.
      expect(screen.queryByText(/leverageX18/)).not.toBeInTheDocument()
    })

    it('degrades to the server detail for a MARGIN_-prefixed code this map does not recognize', () => {
      // This is drift by design (see the logging test below) — expect the warn rather than let
      // jest-fail-on-console flag it as an unexpected console call.
      vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: fetchErrorWith({ errorCode: 'MARGIN_SOME_FUTURE_CODE', detail: 'a brand new reason' }),
        }),
      )
      renderModal()
      expect(screen.getByText('a brand new reason')).toBeInTheDocument()
    })

    it('logs an unrecognized MARGIN_-prefixed errorCode once, not again on an identical re-render', () => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: fetchErrorWith({ errorCode: 'MARGIN_SOME_FUTURE_CODE', detail: 'a brand new reason' }),
        }),
      )
      const { rerender } = renderModal()
      expect(warn).toHaveBeenCalledOnce()
      expect(warn).toHaveBeenCalledWith(
        'useMarginAdjustController',
        'useMarginAdjustController',
        'Unrecognized Margin Trading error: MARGIN_SOME_FUTURE_CODE',
      )

      // Same code again (a fresh error instance, as a real refetch would produce) — must not re-log.
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: fetchErrorWith({ errorCode: 'MARGIN_SOME_FUTURE_CODE', detail: 'a brand new reason' }),
        }),
      )
      rerender(<MarginAdjustPositionModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
      expect(warn).toHaveBeenCalledOnce()
    })

    it('never logs for a coarse (non-MARGIN_) ErrorType — expected for un-converted create-path codes', () => {
      const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined)
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: undefined,
          quoteError: fetchErrorWith({ errorCode: 'UnprocessableEntity', detail: 'some coarse detail' }),
        }),
      )
      renderModal()
      expect(screen.getByText('some coarse detail')).toBeInTheDocument()
      expect(warn).not.toHaveBeenCalled()
    })
  })
})

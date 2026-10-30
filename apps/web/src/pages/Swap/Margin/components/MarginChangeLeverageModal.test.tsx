import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginActivePosition,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginChangeLeverageModal } from '~/pages/Swap/Margin/components/MarginChangeLeverageModal'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
const CURRENT_LEVERAGE_X18 = '2000000000000000000'
// The controller defaults the pay token even though this modal never shows one.
const PAY = `${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`
// Resolved en-US; `render` runs setupi18n() so raw keys never reach the DOM.
const LEVERAGE_LABEL = 'Leverage'

const { SWAPPER, SUB_ID, mockUseMarginQuote, mockExecutePlan, mockUseIsPlanInFlight, mockSpendableBalanceRaw } =
  vi.hoisted(() => ({
    SWAPPER: '0x00000000000000000000000000000000000000A1',
    SUB_ID: '7',
    mockUseMarginQuote: vi.fn(),
    mockExecutePlan: vi.fn(),
    mockUseIsPlanInFlight: vi.fn(() => false),
    mockSpendableBalanceRaw: { current: '2500000000000000000' as string | undefined },
  }))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

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

// Isolates the SUT from the slider's pointer-capture drag machinery (unavailable in jsdom).
vi.mock('~/pages/Swap/Margin/components/shared/MarginLeverageSlider', () => ({
  MarginLeverageSlider: ({ value, onChange }: { value: number; onChange: (next: number) => void }) => (
    <div>
      <span data-testid="slider-value">{value.toFixed(2)}</span>
      <button type="button" aria-label="drag-slider-to-4" onClick={() => onChange(4)}>
        drag
      </button>
    </div>
  ),
}))

vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ address: SWAPPER }) }))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({ executePlan: mockExecutePlan }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

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

// Spreads the original: the controller also imports marginQuoteKey from this module.
vi.mock('~/pages/Swap/Margin/hooks/useMarginQuote', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginQuote')>()),
  useMarginQuote: mockUseMarginQuote,
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { slippageToleranceBps: number; excludedVenues: string[] }) => unknown) =>
    selector({ slippageToleranceBps: 50, excludedVenues: [] }),
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
    size: '2000000000000000000',
    entryPrice: '1850000000000000000000',
    openedAt: '1753000000',
    legs: [
      { venue: 'MORPHO', subId: SUB_ID, account: '0x000000000000000000000000000000000000000A', debt: '2000000000' },
    ],
    isTradable: true,
    equity: '2000000000',
    leverage: '2',
    oraclePrice: '2000000000000000000000',
    liquidationPrice: '1162790697674418604651',
    buffer: '400000000000000000',
    healthFactor: '1720000000000000000',
    maxWithdrawable: '500000000000000000',
    ...overrides,
  }
}

// PROJECTED-ONLY now — no before/after pair, just `display` as the after/current state. drift mode
// sends no target, so a legitimate quote input carries none either.
function quoteFixture(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'increaseLeverage',
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

function mockQuoteResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
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

function renderModal(): ReturnType<typeof render> {
  return render(<MarginChangeLeverageModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
}

function lastQuoteArgs(): Record<string, unknown> {
  return mockUseMarginQuote.mock.calls.at(-1)?.[0] as Record<string, unknown>
}

describe('MarginChangeLeverageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockSpendableBalanceRaw.current = '2500000000000000000'
    mockUseMarginQuote.mockReturnValue(mockQuoteResult({ quote: quoteFixture() }))
  })

  it('opens in drift mode, anchored on the position current leverage, with the CTA dead', () => {
    renderModal()
    expect(screen.getByLabelText(LEVERAGE_LABEL)).toHaveValue('2.00')
    expect(lastQuoteArgs().targetLeverageX18).toBeUndefined()
    expect(screen.getByTestId(TestID.MarginChangeLeverageCta)).toBeDisabled()
  })

  it('builds a create request carrying the leverage target and no funding', () => {
    // useMarginQuote's own param stays WAD (targetLeverageX18) — only the wire request/response
    // fields it builds internally moved to decimal.
    const targetX18 = '3000000000000000000'
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({
        quote: quoteFixture({ leverageTarget: '3', display: { leverage: '3' } }),
        debouncedKey: `none::${targetX18}:${PAY}`,
      }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(LEVERAGE_LABEL), { target: { value: '3' } })
    fireEvent.blur(screen.getByLabelText(LEVERAGE_LABEL))
    // Assert the quote INPUT too, not just the request — a fixture-only assertion would test itself.
    expect(lastQuoteArgs().targetLeverageX18).toBe(targetX18)

    fireEvent.click(screen.getByTestId(TestID.MarginChangeLeverageCta))
    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    // Plan create is quote-only now — no restated leverage/payment field, no echo to build.
    expect(request).toMatchObject({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER })
    expect(request).toHaveProperty('marginQuote')
    expect(request).not.toHaveProperty('paymentAmount')
    expect(request).not.toHaveProperty('withdrawAmount')
    expect(request).not.toHaveProperty('intent')
  })

  // A sub-dust leverage change 200s on quote but 400s at plan-create (MARGIN_ADJUST_NO_CHANGE).
  it('disables the CTA when leverage has not moved past the min delta', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(LEVERAGE_LABEL), { target: { value: '2.02' } })
    fireEvent.blur(screen.getByLabelText(LEVERAGE_LABEL))
    expect(lastQuoteArgs().targetLeverageX18).toBeUndefined()
    expect(screen.getByTestId(TestID.MarginChangeLeverageCta)).toBeDisabled()
  })

  it('prices a dragged slider value', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText('drag-slider-to-4'))
    expect(screen.getByTestId('slider-value')).toHaveTextContent('4.00')
    expect(lastQuoteArgs().targetLeverageX18).toBe('4000000000000000000')
  })

  it('does not render the lock-leverage toggle', () => {
    renderModal()
    expect(screen.queryByTestId('margin-adjust-position-lock-leverage')).not.toBeInTheDocument()
  })

  // The wire omits leverage exactly when equity is at or below zero — the one case with no
  // trustworthy current figure to anchor the slider on, so the control must not render at all. The
  // current leverage now comes straight off the position (no quote round-trip needed to show it).
  it('hides the leverage control for a position with no finite leverage', () => {
    render(
      <MarginChangeLeverageModal
        position={positionFixture({ leverage: undefined })}
        market={MARKET}
        isOpen
        onClose={vi.fn()}
      />,
    )
    expect(screen.queryByLabelText(LEVERAGE_LABEL)).not.toBeInTheDocument()
  })

  // The UNDRAGGED readout is the position's own figure. A position drifted above the venue ceiling
  // (adverse move, or a lowered cap) must not open showing the cap: MarginPairHeading on the same
  // screen reports the real leverage, and the two would contradict each other.
  it('reports a real over-cap leverage rather than the ceiling, until the user drags', () => {
    const overCap = positionFixture({ leverage: '9' })
    render(<MarginChangeLeverageModal position={overCap} market={MARKET} isOpen onClose={vi.fn()} />)
    expect(screen.getByLabelText(LEVERAGE_LABEL)).toHaveValue('9.00')
  })

  // A markets poll can lower the ceiling under an open sheet. The readout re-clamps on render, but the
  // STORED drag is what feeds the quote and Confirm — so without the clamp effect the request keeps a
  // target the venue no longer offers and the backend refuses it.
  it('clamps a dragged target down when a poll lowers the venue ceiling', () => {
    const { rerender } = render(
      <MarginChangeLeverageModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />,
    )
    fireEvent.click(screen.getByLabelText('drag-slider-to-4'))
    expect(lastQuoteArgs().targetLeverageX18).toBe('4000000000000000000')

    const lowered = { ...MARKET, maxLeverage: 3 }
    rerender(<MarginChangeLeverageModal position={positionFixture()} market={lowered} isOpen onClose={vi.fn()} />)

    expect(lastQuoteArgs().targetLeverageX18).toBe('3000000000000000000')
  })

  // The footer's unusable state and the CTA must agree. A poll can drop `leverage` mid-sheet (equity
  // reaching zero), unmounting the slider while the stored drag keeps quoting — leaving Confirm live
  // beside copy saying there is no margin left to leverage against.
  it('shuts Confirm when a poll drops the position leverage under a dragged target', () => {
    const { rerender } = render(
      <MarginChangeLeverageModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />,
    )
    // Confirm only arms once the settled quote answers the VISIBLE edit, so the mock's debounced key
    // has to be the dragged one.
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `none::4000000000000000000:${PAY}` }),
    )
    fireEvent.click(screen.getByLabelText('drag-slider-to-4'))
    expect(screen.getByTestId(TestID.MarginChangeLeverageCta)).toBeEnabled()

    rerender(
      <MarginChangeLeverageModal
        position={positionFixture({ leverage: undefined })}
        market={MARKET}
        isOpen
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/no margin left to leverage against/)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginChangeLeverageCta)).toBeDisabled()
  })

  it('never sends funding', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText('drag-slider-to-4'))
    expect(lastQuoteArgs().funding).toEqual({ kind: 'none' })
  })

  // Equity at or below zero has no finite leverage, so there is nothing to anchor a slider on and
  // Confirm can never arm. Without the footer copy the modal is an empty body under the heading and a
  // greyed-out button that says nothing — on a position that is in trouble and needs a different action.
  it('explains itself instead of rendering an empty body when the position has no finite leverage', () => {
    render(
      <MarginChangeLeverageModal
        position={positionFixture({ leverage: undefined })}
        market={MARKET}
        isOpen
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('drag-slider-to-4')).not.toBeInTheDocument()
    expect(screen.getByText(/no margin left to leverage against/)).toBeInTheDocument()
  })
})

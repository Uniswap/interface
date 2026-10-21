import { fireEvent, screen, waitFor } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import type { MarginActivePosition, MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginCloseModal } from '~/pages/Swap/Margin/components/MarginCloseModal'
import { MarginExplainerContent } from '~/pages/Swap/Margin/components/shared/MarginExplainer'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
const ACCOUNT = '0x000000000000000000000000000000000000000A'

// SWAPPER/SUB_ID live inside vi.hoisted (not just above it) because vi.mock/vi.hoisted factories are
// hoisted above ALL module-scope statements, including const declarations that textually precede them.
const {
  SWAPPER,
  SUB_ID,
  mockUseMarginQuote,
  mockExecutePlan,
  mockUseIsPlanInFlight,
  mockAccountAddress,
  mockFetchMarginQuote,
  mockMarkIsStale,
} = vi.hoisted(() => {
  const SWAPPER = '0x00000000000000000000000000000000000000A1'
  const SUB_ID = '7'
  return {
    SWAPPER,
    SUB_ID,
    mockUseMarginQuote: vi.fn(),
    mockExecutePlan: vi.fn(),
    mockUseIsPlanInFlight: vi.fn(() => false),
    mockAccountAddress: { current: SWAPPER as string | undefined },
    mockFetchMarginQuote: vi.fn(),
    mockMarkIsStale: { current: false },
  }
})

// Render Modal children inline so in-modal content is testable without portal/animation machinery
// (same approach as MarginAdjustPositionModal.test.tsx).
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
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

vi.mock('~/pages/Swap/Margin/hooks/useMarginQuote', () => ({
  useMarginQuote: mockUseMarginQuote,
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginPositionMarkIsStale', () => ({
  useMarginPositionMarkIsStale: () => mockMarkIsStale.current,
}))

// A debt-free close never gets a polled quote (the hook gates on nonzero debt) — the modal fetches
// one directly via MarginApiClient, mirroring the positions table's retry-open pattern.
vi.mock('uniswap/src/data/apiClients/tradingApi/MarginApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/MarginApiClient')>()
  return { ...actual, MarginApiClient: { ...actual.MarginApiClient, fetchMarginQuote: mockFetchMarginQuote } }
})

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { slippageToleranceBps: number; excludedVenues: string[] }) => unknown) =>
    selector({ slippageToleranceBps: 50, excludedVenues: [] }),
}))

function positionFixture(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
  return {
    positionId: SUB_ID,
    status: 'ACTIVE',
    direction: 'LONG',
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    size: '2000000000000000000', // 2 WETH
    entryPrice: '1850000000000000000000',
    openedAt: '1753000000',
    legs: [{ venue: 'MORPHO', subId: SUB_ID, account: ACCOUNT, debt: '2000000000' }], // 2000 USDC
    isTradable: true,
    equity: '2000000000',
    leverage: '2',
    oraclePrice: '2000000000000000000000', // $2000/ETH
    liquidationPrice: '1162790697674418604651',
    buffer: '400000000000000000',
    healthFactor: '1720000000000000000',
    maxWithdrawable: '500000000000000000',
    ...overrides,
  }
}

// PROJECTED-ONLY now — display.collateralReturned IS the net proceeds (no more manual subtraction).
function quoteFixture(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'close',
    chainId: MARGIN_CHAIN_ID,
    swapper: SWAPPER,
    direction: 'LONG',
    exposureToken: {
      address: MARKET.collateral.address,
      chainId: MARGIN_CHAIN_ID,
      decimals: MARKET.collateral.decimals,
    },
    counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
    positionId: SUB_ID,
    display: {
      effectivePrice: '2000000000000000000000',
      collateralReturned: '1100000000000000000', // 2 WETH held - 0.9 WETH sold
    },
    legs: [
      {
        venue: 'MORPHO',
        collateralToken: MARKET.collateral.address,
        debtToken: MARKET.debt.address,
        subId: SUB_ID,
        equityShare: '1000000000000000000',
        bounds: {
          decrease: {
            debtToRepay: '2000000000',
            maxCollateralIn: '950000000000000000', // well under the 2 WETH held -> not underwater
            // The pool the exit was quoted on; the modal must round-trip it verbatim into the create.
            swapPoolKey:
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-500-10-0x0000000000000000000000000000000000000000',
          },
        },
      },
    ],
    deadlineSuggestion: '1753290000',
    ...overrides,
  }
}

// A debt-free close's quote: no swap, so the decrease bounds settle at zero.
function debtFreeQuoteFixture(): MarginQuoteResponse {
  return quoteFixture({
    display: { effectivePrice: '2000000000000000000000', collateralReturned: '2000000000000000000' },
    legs: [
      {
        venue: 'MORPHO',
        collateralToken: MARKET.collateral.address,
        debtToken: MARKET.debt.address,
        subId: SUB_ID,
        equityShare: '1000000000000000000',
        bounds: { decrease: { debtToRepay: '0', maxCollateralIn: '0' } },
      },
    ],
  })
}

function baseQuoteResult(): {
  quote: MarginQuoteResponse | undefined
  isQuoteLoading: boolean
  isDebouncing: boolean
  isPlaceholderData: boolean
  quoteError: unknown
} {
  return { quote: undefined, isQuoteLoading: false, isDebouncing: false, isPlaceholderData: false, quoteError: null }
}

function renderModal(overrides: Partial<MarginActivePosition> = {}): ReturnType<typeof render> {
  return render(<MarginCloseModal position={positionFixture(overrides)} market={MARKET} isOpen onClose={vi.fn()} />)
}

describe('MarginCloseModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockAccountAddress.current = SWAPPER
    mockUseMarginQuote.mockReturnValue(baseQuoteResult())
  })

  afterEach(() => {
    mockAccountAddress.current = SWAPPER
    mockMarkIsStale.current = false
  })

  // These keys are real (translated) entries in en-US.json, so they render as actual copy in tests, not
  // the raw key — unlike pluralized/interpolated keys (see marginCloseGate.test.ts's sibling notes).
  it('renders full-exit only: no percent selector, CTA is the close confirm', () => {
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture() })
    renderModal()

    // Title by testID: the CTA now resolves to the same "Close position" copy.
    expect(screen.getByTestId(TestID.MarginModalTitle)).toHaveTextContent('Close position')
    expect(screen.getByText('Withdrawing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close position' })).toBeInTheDocument()

    // The percent selector (chips + drag slider) is gone — full exit is the only path.
    expect(screen.queryByText('25%')).not.toBeInTheDocument()
    expect(screen.queryByText('100%')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Percentage of debt to reduce')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reduce position' })).not.toBeInTheDocument()
  })

  const DEBT_FREE_LEGS = [{ venue: 'MORPHO' as const, subId: SUB_ID, account: ACCOUNT, debt: '0' }]

  it('a debt-free position needs no quote and enables the CTA', () => {
    renderModal({ legs: DEBT_FREE_LEGS })
    expect(screen.getByText('Withdrawing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close position' })).not.toBeDisabled()
  })

  // The polled hook gates on a nonzero debt (the close action key names no amount), so a debt-free
  // position never gets a quote from it — onConfirm fetches one directly instead.
  it('onConfirm fetches a no-swap close quote and submits it for a debt-free position', async () => {
    mockFetchMarginQuote.mockResolvedValue(debtFreeQuoteFixture())
    const onClose = vi.fn()
    render(
      <MarginCloseModal
        position={positionFixture({ legs: DEBT_FREE_LEGS })}
        market={MARKET}
        isOpen
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close position' }))

    await waitFor(() => expect(mockExecutePlan).toHaveBeenCalledTimes(1))
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    expect(request).toEqual({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER, marginQuote: debtFreeQuoteFixture() })
    expect(mockFetchMarginQuote).toHaveBeenCalledWith(
      expect.objectContaining({ swapper: SWAPPER, close: { positionId: SUB_ID } }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  // The swapper is captured at press, and this arm creates the plan only after a quote round-trip. A
  // switch inside that window must not mint a plan the new wallet can never sign — the executor would
  // refuse it, but only after the create POST had already minted the orphan.
  // The plan must not be minted for the previous wallet — and the sheet must not just sit there either:
  // it is showing a position the current wallet does not own, and a silent return reads as Close having
  // done nothing at all.
  it('dismisses instead of submitting when the account changed during the debt-free quote fetch', async () => {
    mockFetchMarginQuote.mockImplementation(async () => {
      mockAccountAddress.current = '0x00000000000000000000000000000000000000ff'
      return debtFreeQuoteFixture()
    })
    const onClose = vi.fn()
    render(
      <MarginCloseModal
        position={positionFixture({ legs: DEBT_FREE_LEGS })}
        market={MARKET}
        isOpen
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close position' }))

    await waitFor(() => expect(mockFetchMarginQuote).toHaveBeenCalledTimes(1))
    expect(mockExecutePlan).not.toHaveBeenCalled()
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('onConfirm submits a full CLOSE (never DECREASE) once the debt-bearing quote lands', () => {
    const quote = quoteFixture()
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote })
    const onClose = vi.fn()
    render(<MarginCloseModal position={positionFixture()} market={MARKET} isOpen onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close position' }))

    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    // Plan create is quote-only now — the debt-bearing quote (already in hand from the poll above) is
    // posted verbatim, with no restated fields and no echo to build.
    expect(request).toEqual({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER, marginQuote: quote })
    expect(mockFetchMarginQuote).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('disables the CTA while a plan is already in flight', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture() })
    renderModal()
    expect(screen.getByRole('button', { name: 'Close position' })).toBeDisabled()
  })

  it('explains that the realized PnL is an estimate', () => {
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture() })
    renderModal({ costBasisUsd: '25000000' })
    expect(screen.getByTestId('margin-est-pnl-trigger')).toBeInTheDocument()
  })

  it('surfaces a failed debt-free quote instead of leaving the CTA live', async () => {
    // The arm logs before setting its error state; the suite forbids a real console.error.
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    mockFetchMarginQuote.mockRejectedValueOnce(new Error('boom'))
    renderModal({ legs: DEBT_FREE_LEGS })
    fireEvent.click(screen.getByRole('button', { name: 'Close position' }))
    await waitFor(() => expect(screen.getByText('Couldn’t fetch a quote. Try again.')).toBeInTheDocument())
    expect(mockExecutePlan).not.toHaveBeenCalled()
    loggerSpy.mockRestore()
  })

  // A debt-free close has no polled quote for the life of the screen. Rendering "0" there would price
  // realized PnL as `0 − costBasis` and paint the whole basis as a loss beside a CTA that closes fine.
  it('shows no amount or PnL until a quote exists, rather than zeroes', () => {
    renderModal({ legs: DEBT_FREE_LEGS, costBasisUsd: '25000000' })
    expect(screen.queryByTestId('margin-est-pnl-trigger')).not.toBeInTheDocument()
    expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument()
  })

  it('renders no estimate explainer when the position has no valued basis', () => {
    renderModal()
    expect(screen.queryByTestId('margin-est-pnl-trigger')).not.toBeInTheDocument()
  })

  it('names how far the fill can slip', () => {
    render(<MarginExplainerContent estimate slippagePercent={0.5} />)
    expect(screen.getByText(/up to 0.5% worse than this quote/)).toBeInTheDocument()
  })

  // '0' oracle is a real wire state, and it is NOT a zero price. A LONG's proceeds valued through it
  // come out at $0.00, which prices realized PnL as `0 − costBasis` — the whole basis rendered as a
  // loss on a close that in fact returns the entire position.
  it('reports no USD proceeds or PnL on the zero-oracle sentinel, rather than a fabricated total loss', () => {
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture() })
    renderModal({ oraclePrice: '0', costBasisUsd: '2500000000' })
    expect(screen.queryByText(/^−\$/)).toBeNull()
    expect(screen.queryByText('$0.00')).toBeNull()
    expect(screen.queryByTestId('margin-est-pnl-trigger')).not.toBeInTheDocument()
  })

  // The impact figure is fill-vs-MARK, and this modal's mark is the position's — polled apart from the
  // quote it is divided into. There is no fallback: withholding an aged mark would hide the row on the
  // last screen before funds move, so the row discloses the age instead. The caption only reaches the
  // DOM through the trigger, which is what asserts the signal is actually wired to a producer.
  const IMPACTFUL_QUOTE = {
    display: { effectivePrice: '1800000000000000000000', collateralReturned: '1100000000000000000' },
  } // 10% under the $2000 mark

  function renderWithImpact(): void {
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture(IMPACTFUL_QUOTE) })
    renderModal()
  }

  it('captions the price-impact row when the position mark it was measured against has aged out', () => {
    mockMarkIsStale.current = true
    renderWithImpact()
    expect(screen.getByText('Price difference')).toBeInTheDocument()
    expect(document.querySelector('[data-base-ui-tooltip-trigger]')).toBeInTheDocument()
  })

  it('leaves the row uncaptioned on a fresh mark', () => {
    renderWithImpact()
    expect(screen.getByText('Price difference')).toBeInTheDocument()
    expect(document.querySelector('[data-base-ui-tooltip-trigger]')).not.toBeInTheDocument()
  })

  // An aged mark computes a SMALL impact as easily as a large one — a mark from before a big move can
  // land under the warning threshold. Hiding the row there withholds the delay notice in the very case
  // the mark is least trustworthy, so staleness alone earns the row.
  const QUIET_QUOTE = {
    display: { effectivePrice: '1995000000000000000000', collateralReturned: '1100000000000000000' },
  } // 0.25% under the mark

  it('still discloses a delayed mark when the impact itself is below the warning threshold', () => {
    mockMarkIsStale.current = true
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture(QUIET_QUOTE) })
    renderModal()
    expect(screen.getByText('Price difference')).toBeInTheDocument()
    expect(document.querySelector('[data-base-ui-tooltip-trigger]')).toBeInTheDocument()
  })

  it('hides a below-threshold impact entirely on a fresh mark', () => {
    mockUseMarginQuote.mockReturnValue({ ...baseQuoteResult(), quote: quoteFixture(QUIET_QUOTE) })
    renderModal()
    expect(screen.queryByText('Price difference')).not.toBeInTheDocument()
  })

  // A SHORT's held collateral is `equity + debt x mark`, so the mark is load-bearing on the revert
  // guard for that direction only. Handed the RAW oraclePrice, the wire's '0' collapsed it to equity
  // alone and a perfectly healthy short read as underwater — blocked from its only exit by one poll.
  // The guard exists to stop a close that would revert, so it has to fail OPEN where it cannot measure.
  describe('the zero-price sentinel on a SHORT', () => {
    const SHORT_MARKET = {
      ...MARKET,
      direction: 'SHORT' as const,
      collateral: MARKET.debt,
      debt: MARKET.collateral,
    }
    // 4,000 USDC of collateral against 1 WETH of debt: held = 1000 equity + 1 x mark.
    const SHORT_POSITION = positionFixture({
      direction: 'SHORT',
      exposureToken: { address: MARKET.collateral.address, chainId: MARGIN_CHAIN_ID, decimals: 18 },
      counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: 6 },
      size: '1000000000000000000',
      equity: '1000000000',
      legs: [{ venue: 'MORPHO', subId: SUB_ID, account: ACCOUNT, debt: '1000000000000000000' }],
    })
    // 2,900 USDC — under the 3,000 the position holds at a live $2,000 mark, over the 1,000 a zero
    // mark would compute.
    const BOUND = { legs: [{ ...quoteFixture().legs[0], bounds: { decrease: { maxCollateralIn: '2900000000' } } }] }

    it('does not report a healthy short as underwater when the mark is the sentinel', () => {
      mockUseMarginQuote.mockReturnValue({
        ...baseQuoteResult(),
        quote: { ...quoteFixture(), ...BOUND } as MarginQuoteResponse,
      })
      render(
        <MarginCloseModal
          position={{ ...SHORT_POSITION, oraclePrice: '0' }}
          market={SHORT_MARKET}
          isOpen
          onClose={vi.fn()}
        />,
      )
      expect(screen.queryByText(/underwater/)).not.toBeInTheDocument()
    })

    // The carve-out must not become a blanket bypass: a bound genuinely over the held collateral still
    // blocks when the mark IS known.
    it('still reports a real over-bound short as underwater at a live mark', () => {
      mockUseMarginQuote.mockReturnValue({
        ...baseQuoteResult(),
        quote: {
          ...quoteFixture(),
          legs: [{ ...quoteFixture().legs[0], bounds: { decrease: { maxCollateralIn: '3100000000' } } }],
        } as MarginQuoteResponse,
      })
      render(<MarginCloseModal position={SHORT_POSITION} market={SHORT_MARKET} isOpen onClose={vi.fn()} />)
      expect(screen.getByText(/underwater/)).toBeInTheDocument()
    })
  })
})

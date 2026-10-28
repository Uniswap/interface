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
import { MarginAddModal } from '~/pages/Swap/Margin/components/MarginAddModal'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
// The default pay token here is NATIVE ETH — 18 decimals, not 6.
const RAW_100_ETH = '100000000000000000000'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const PAY = `${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`
// Resolved en-US; `render` runs setupi18n() so raw keys never reach the DOM.
const AMOUNT_LABEL = 'Amount to add'

const {
  SWAPPER,
  SUB_ID,
  mockUseMarginQuote,
  mockExecutePlan,
  mockUseIsPlanInFlight,
  mockSpendableBalanceRaw,
  mockExcludedVenues,
} = vi.hoisted(() => ({
  SWAPPER: '0x00000000000000000000000000000000000000A1',
  SUB_ID: '7',
  mockUseMarginQuote: vi.fn(),
  mockExecutePlan: vi.fn(),
  mockUseIsPlanInFlight: vi.fn(() => false),
  mockSpendableBalanceRaw: { current: '2500000000000000000' as string | undefined },
  mockExcludedVenues: { current: [] as string[] },
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
    />
  ),
}))

// Exposes the one interaction the real selector provides, so a test can reach the cross-token state
// the default payment token (the collateral itself) never enters on its own.
vi.mock('~/pages/Swap/Margin/components/MarginPaymentTokenSelector', () => ({
  MarginPaymentTokenSelector: ({ onSelect }: { onSelect: (token: unknown) => void }) => (
    <button
      type="button"
      aria-label="pick-usdc"
      onClick={() =>
        onSelect({ address: USDC_ADDRESS, chainId: MARGIN_CHAIN_ID, decimals: 6, symbol: 'USDC', isNative: false })
      }
    />
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
    selector({ slippageToleranceBps: 50, excludedVenues: mockExcludedVenues.current }),
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
    equity: '2000000000', // 2000 USDC
    leverage: '2',
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
    action: 'addEquity',
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
  return render(<MarginAddModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
}

// The default payment token IS the collateral, so the conversion caption never renders until a
// different one is picked — which is what the stubbed selector above is for.
function renderCrossToken(): ReturnType<typeof render> {
  const result = render(<MarginAddModal position={positionFixture()} market={MARKET} isOpen onClose={vi.fn()} />)
  fireEvent.click(screen.getByLabelText('pick-usdc'))
  return result
}
const withEquityIn = (expectedEquityDelta: string): MarginQuoteResponse =>
  ({
    ...quoteFixture(),
    legs: [{ ...quoteFixture().legs[0], bounds: { increase: { expectedEquityDelta } } }],
  }) as MarginQuoteResponse

describe('MarginAddModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockSpendableBalanceRaw.current = '2500000000000000000'
    mockExcludedVenues.current = []
    mockUseMarginQuote.mockReturnValue(mockQuoteResult())
  })

  it('builds an ADJUST request carrying paymentAmount and no withdrawAmount', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
    )
    // The pay-token balance must cover it or insufficientBalance closes the gate.
    mockSpendableBalanceRaw.current = '200000000000000000000'
    renderModal()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '100' } })
    fireEvent.click(screen.getByTestId(TestID.MarginAddCta))

    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    // Plan create is quote-only now — the quote (which carried paymentAmount as swapConfig.amount at
    // request time) is posted verbatim; there is no restated top-level payment/intent field to assert.
    expect(request).toMatchObject({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER })
    expect(request).toHaveProperty('marginQuote')
    expect(request).not.toHaveProperty('paymentAmount')
    expect(request).not.toHaveProperty('withdrawAmount')
    expect(request).not.toHaveProperty('intent')
  })

  // Disabled is the CTA's default on open, so a permanently-dead CTA would pass a blank-amount-only
  // test. Pair both states in one case so the assertion actually discriminates.
  it('enables the CTA only once a valid amount is entered', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
    )
    mockSpendableBalanceRaw.current = '200000000000000000000'
    renderModal()
    expect(screen.getByTestId(TestID.MarginAddCta)).toBeDisabled()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '100' } })
    expect(screen.getByTestId(TestID.MarginAddCta)).not.toBeDisabled()
  })

  it('fills the max spendable balance', () => {
    renderModal()
    fireEvent.click(screen.getByLabelText('Use max balance'))
    expect(screen.getByLabelText(AMOUNT_LABEL)).toHaveValue('2.5')
  })

  it('keeps the CTA dead when the deposit exceeds the spendable balance', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
    )
    renderModal() // spendable is 2.5 ETH
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '100' } })
    expect(screen.getByTestId(TestID.MarginAddCta)).toBeDisabled()
  })

  // The controller's caller contract: blank/garbage input must be { kind: 'none' }, never a deposit
  // with an empty amount — and parseUnits throws on inputs Number() happily accepts.
  it.each(['', '  ', 'abc', '0', '-1', 'Infinity', '1e5'])(
    'treats %p as no funding rather than an empty-amount deposit',
    (value) => {
      renderModal()
      fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value } })
      const args = mockUseMarginQuote.mock.calls.at(-1)?.[0] as { funding: { kind: string } }
      expect(args.funding).toEqual({ kind: 'none' })
    },
  )

  it('disables the CTA while a plan is in flight', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
    )
    mockSpendableBalanceRaw.current = '200000000000000000000'
    renderModal()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '100' } })
    expect(screen.getByTestId(TestID.MarginAddCta)).toBeDisabled()
    expect(screen.getByText('Another action is in progress')).toBeInTheDocument()
  })

  // The opt-out preference governs where a NEW open routes; an already-open position keeps its venue.
  // The two would otherwise contradict each other with nothing on screen to explain it.
  describe('excluded-venue disclosure', () => {
    it('names the position’s venue when the preferences leave it out', () => {
      mockExcludedVenues.current = [MARKET.venue]
      renderModal()
      expect(screen.getByTestId(TestID.MarginPositionVenueExcluded).textContent).toBe(
        'This position is on Morpho, which your venue preferences leave out. You can still manage it here.',
      )
    })

    it('stays silent while the position’s venue is enabled', () => {
      mockExcludedVenues.current = ['AAVE_V3']
      renderModal()
      expect(screen.queryByTestId(TestID.MarginPositionVenueExcluded)).toBeNull()
    })

    // Informational only — disclosing a venue must never take away the ability to manage what is
    // already open on it.
    it('leaves the CTA reachable on an excluded venue', () => {
      mockExcludedVenues.current = [MARKET.venue]
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: quoteFixture(), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
      )
      mockSpendableBalanceRaw.current = '200000000000000000000'
      renderModal()
      fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '100' } })
      expect(screen.getByTestId(TestID.MarginAddCta)).not.toBeDisabled()
    })
  })

  // This sentence pairs the LIVE input with a figure off the settled quote, so it had all three of the
  // rule's guards missing here: no freshness term, a `!== undefined` test that the truthy string '0'
  // walks through, and a bare BigInt decode that throws mid-render on a non-integer.
  describe('the cross-token conversion caption', () => {
    it('states the landed collateral when the quote answers the current input', () => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: withEquityIn('980000000000000000'), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
      )
      renderCrossToken()
      expect(screen.getByText(/0\.98/)).toBeInTheDocument()
    })

    it('withholds it at the zero sentinel rather than rendering "≈ 0"', () => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({ quote: withEquityIn('0'), debouncedKey: `deposit:${RAW_100_ETH}::${PAY}` }),
      )
      renderCrossToken()
      expect(screen.queryByText(/≈/)).not.toBeInTheDocument()
    })

    it.each(['isDebouncing', 'isPlaceholderData'])('withholds it while %s', (flag) => {
      mockUseMarginQuote.mockReturnValue(
        mockQuoteResult({
          quote: withEquityIn('980000000000000000'),
          debouncedKey: `deposit:${RAW_100_ETH}::${PAY}`,
          [flag]: true,
        }),
      )
      renderCrossToken()
      expect(screen.queryByText(/≈/)).not.toBeInTheDocument()
    })
  })
})

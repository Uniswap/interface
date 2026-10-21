import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  type MarginActivePosition,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginWithdrawModal } from '~/pages/Swap/Margin/components/MarginWithdrawModal'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity
// The controller defaults the pay token to native ETH even for a withdraw; the key's trailing
// segments are its wire sentinel + chain id.
const PAY = `${MARGIN_NATIVE_TOKEN_ADDRESS}:${MARGIN_CHAIN_ID}`
// Resolved en-US; `render` runs setupi18n() so raw keys never reach the DOM.
const AMOUNT_LABEL = 'Amount to withdraw'
const RAW_HALF_ETH = '500000000000000000'

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
    direction: 'LONG',
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
    // The withdraw ceiling: now the ACTIVE position row's own field, not the quote's.
    maxWithdrawable: '500000000000000000',
    ...overrides,
  }
}

// PROJECTED-ONLY now — no before/after pair, just `display` as the after/current state.
function quoteFixture(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'withdrawEquity',
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

function renderModal(position: MarginActivePosition = positionFixture()): ReturnType<typeof render> {
  return render(<MarginWithdrawModal position={position} market={MARKET} isOpen onClose={vi.fn()} />)
}

describe('MarginWithdrawModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockSpendableBalanceRaw.current = '2500000000000000000'
    mockUseMarginQuote.mockReturnValue(mockQuoteResult({ quote: quoteFixture() }))
  })

  it('builds an ADJUST request carrying withdrawAmount and no payment fields', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `withdraw:${RAW_HALF_ETH}::${PAY}` }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '0.5' } })
    fireEvent.click(screen.getByTestId(TestID.MarginWithdrawCta))

    expect(mockExecutePlan).toHaveBeenCalledTimes(1)
    const [{ request }] = mockExecutePlan.mock.calls[0] as [{ request: Record<string, unknown> }]
    // Plan create is quote-only now — no restated withdraw/payment field, no echo to build.
    expect(request).toMatchObject({ chainId: MARGIN_CHAIN_ID, swapper: SWAPPER })
    expect(request).toHaveProperty('marginQuote')
    expect(request).not.toHaveProperty('paymentAmount')
    expect(request).not.toHaveProperty('paymentToken')
    expect(request).not.toHaveProperty('targetLeverageX18')
    expect(request).not.toHaveProperty('intent')
  })

  // MAX fills just UNDER the ceiling: requesting computeMaxWithdrawable verbatim lands health exactly
  // on the floor and the server 422s it (measured on mainnet).
  it('shows the ceiling from the preview quote and fills just under it on tap', () => {
    renderModal()
    expect(screen.getByText('Available 0.500 ETH')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Use max'))
    const filled = Number((screen.getByLabelText(AMOUNT_LABEL) as HTMLInputElement).value)
    expect(filled).toBeLessThan(0.5)
    expect(filled).toBeGreaterThan(0.49)
  })

  it('suppresses the input entirely and explains why when nothing is available', () => {
    renderModal(positionFixture({ maxWithdrawable: '0' }))
    expect(screen.getByText('Nothing available to withdraw')).toBeInTheDocument()
    expect(screen.queryByLabelText(AMOUNT_LABEL)).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginWithdrawCta)).toBeDisabled()
  })

  it('blocks a withdraw past the server ceiling', () => {
    mockUseMarginQuote.mockReturnValue(
      mockQuoteResult({ quote: quoteFixture(), debouncedKey: `withdraw:900000000000000000::${PAY}` }),
    )
    renderModal()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '0.9' } })
    expect(screen.getByTestId(TestID.MarginWithdrawCta)).toBeDisabled()
    expect(screen.getByText('Amount exceeds the available maximum')).toBeInTheDocument()
  })

  // The dust remainder is the server's (WITHDRAW_MIN_REMAINING_BPS), so Adjust can never empty a
  // debt-free position — say so rather than letting MAX look broken.
  it('hints at Close on a debt-free position', () => {
    renderModal(
      positionFixture({
        legs: [{ venue: 'MORPHO', subId: SUB_ID, account: '0x000000000000000000000000000000000000000A', debt: '0' }],
      }),
    )
    expect(screen.getByText('To take out everything, close the position instead')).toBeInTheDocument()
  })

  // A LONG's collateral USD value is amount x mark, so the wire's "no price" sentinel captioned every
  // amount the user typed as "$0.00" — on a sheet that stays fully submittable, because its ceiling is
  // the server's `maxWithdrawable` and never this read. Withheld rather than fabricated.
  it('withholds the USD caption for a LONG at the zero-price sentinel', () => {
    renderModal(positionFixture({ oraclePrice: '0' }))
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '1.5' } })
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
  })

  it('still captions a priced LONG', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value: '1.5' } })
    expect(screen.getByText('$3,000.00')).toBeInTheDocument()
  })

  it('does not hint at Close while the position carries debt', () => {
    renderModal()
    expect(screen.queryByText('To take out everything, close the position instead')).not.toBeInTheDocument()
  })

  it.each(['', '  ', 'abc', '0', '-1', 'Infinity', '1e5'])(
    'treats %p as no funding rather than an empty-amount withdraw',
    (value) => {
      renderModal()
      fireEvent.change(screen.getByLabelText(AMOUNT_LABEL), { target: { value } })
      const args = mockUseMarginQuote.mock.calls.at(-1)?.[0] as { funding: { kind: string } }
      expect(args.funding).toEqual({ kind: 'none' })
    },
  )
})

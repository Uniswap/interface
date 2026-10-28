import { screen } from '@testing-library/react'
import type { MarginActivePosition, MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import {
  MarginAdjustBeforeAfterRows,
  MarginAdjustBeforeAfterRowsSkeleton,
  MarginBorrowingRow,
} from '~/pages/Swap/Margin/components/MarginAdjustBeforeAfterRows'
import { render } from '~/test-utils/render'

// Echo the symbol so logo presence is assertable; its real no-URL fallback renders the symbol as bare
// text, which is indistinguishable from the amount's own symbol.
vi.mock('uniswap/src/components/CurrencyLogo/TokenLogo', () => ({
  TokenLogo: ({ symbol }: { symbol?: string }) => <div data-testid="token-logo" data-symbol={symbol} />,
}))

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH_META = { address: WETH, chainId: MARGIN_CHAIN_ID, decimals: 18 }
const USDC_META = { address: USDC, chainId: MARGIN_CHAIN_ID, decimals: 6 }

// The "before" column: the ACTIVE positions row the table already holds. 2 WETH at $2,000 against
// 2,000 USDC of debt — 2x, healthy.
const POSITION: MarginActivePosition = {
  positionId: '7',
  status: 'ACTIVE',
  direction: MarginDirection.LONG,
  exposureToken: WETH_META,
  counterToken: USDC_META,
  size: '2000000000000000000',
  entryPrice: '1850000000000000000000',
  openedAt: '1753000000',
  legs: [{ venue: 'MORPHO', subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '2000000000' }],
  isTradable: true,
  equity: '2000000000',
  leverage: '2',
  oraclePrice: '2000000000000000000000',
  liquidationPrice: '1162790697674418604651',
  buffer: '400000000000000000',
  healthFactor: '1720000000000000000',
  maxWithdrawable: '500000000000000000',
}

// The "after" column: PROJECTED-ONLY, no before/after pair on the wire. 3 WETH at 3x, into Caution.
const QUOTE: MarginQuoteResponse = {
  requestId: 'r1',
  action: 'addEquityAndIncreaseLeverage',
  chainId: MARGIN_CHAIN_ID,
  swapper: '0x00000000000000000000000000000000000000A1',
  direction: MarginDirection.LONG,
  exposureToken: WETH_META,
  counterToken: USDC_META,
  display: {
    size: '3000000000000000000',
    leverage: '3',
    healthFactor: '1150000000000000000',
    liquidationPrice: '1550000000000000000000',
  },
  legs: [
    {
      venue: 'MORPHO',
      collateralToken: WETH,
      debtToken: USDC,
      equityShare: '1000000000000000000',
      // A SLIPPAGE CAP, not the debt — no row may report it as one.
      bounds: { increase: { maxDebtIn: '9999000000' } },
    },
  ],
  deadlineSuggestion: '1753290000',
  gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000' },
}

// A short's exposure IS its debt leg: exposure = WETH (18dp), counter/collateral = USDC (6dp).
const SHORT_POSITION: MarginActivePosition = {
  ...POSITION,
  direction: MarginDirection.SHORT,
  legs: [{ ...POSITION.legs[0]!, debt: '2000000000000000000' }],
}
const SHORT_QUOTE: MarginQuoteResponse = { ...QUOTE, direction: MarginDirection.SHORT }

const BASE = {
  markIsStale: false,
  quote: QUOTE,
  position: POSITION,
  sizeLogos: { symbol: 'ETH' },
}

// Read the row labels in DOM order — the whole point of rowOrder is which one comes second.
function labelOrder(): string[] {
  const wanted = ['Leverage', 'Size', 'Liquidates at', 'Borrowing']
  return Array.from(document.querySelectorAll('span'))
    .map((el) => el.textContent.trim())
    .filter((text) => wanted.includes(text))
}

describe('MarginAdjustBeforeAfterRows', () => {
  it('defaults to Size before Liquidates at', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(labelOrder()).toEqual(['Leverage', 'Size', 'Liquidates at'])
  })

  // Add margin and Withdraw margin put the two rows carrying the meaning of the change next to
  // each other. Nothing asserted this ordering before.
  it('lifts Liquidates at above Size under rowOrder="liquidationSecond"', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} rowOrder="liquidationSecond" />)
    expect(labelOrder()).toEqual(['Leverage', 'Liquidates at', 'Size'])
  })

  // The wire ships no before/after pair: "before" is the positions row, "after" is quote.display, and
  // the arrow between them is composed here.
  it('composes each row from the positions row and the projection', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(screen.getByLabelText('Leverage: 2.00x to 3.00x')).toBeInTheDocument()
    expect(screen.getByLabelText('Size: 2.00 ETH to 3.00 ETH')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Liquidates at: \$1,162\.79 to \$1,550\.00 \(−22\.5%\)$/)).toBeInTheDocument()
  })

  // Health is the one row whose before/after are tier LABELS, and the tier moves here.
  it('moves the health tier from the position to the projection', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(screen.getByLabelText('Health factor: Healthy to Caution')).toBeInTheDocument()
  })

  // Add/Withdraw margin report no size, so the debt projection is undefined rather than 0 — the "0"
  // health sentinel still has to be read as debt-free, or a de-risked position reads as endangered.
  describe('the debt-free "0" health sentinel', () => {
    const DEBT_FREE_POSITION: MarginActivePosition = {
      ...POSITION,
      legs: [{ ...POSITION.legs[0]!, debt: '0' }],
      healthFactor: '0',
      leverage: '1',
    }
    // An equity-only key: no size on the projection, so projectedDebtAmount cannot recover a debt.
    const EQUITY_ONLY_QUOTE: MarginQuoteResponse = {
      ...QUOTE,
      action: 'addEquity',
      display: { healthFactor: '0' },
    }

    // Both sides land on the same tier, which collapses to one label rather than a transition.
    it('reads it as debt-free when the position carries no debt', () => {
      render(<MarginAdjustBeforeAfterRows {...BASE} position={DEBT_FREE_POSITION} quote={EQUITY_ONLY_QUOTE} />)
      expect(screen.queryByLabelText(/^Health factor:/)).not.toBeInTheDocument()
      expect(screen.getByText('Healthy')).toBeInTheDocument()
    })

    // The other inversion: on a position that DOES carry debt, an undefined projection means "debt
    // unchanged", so a "0" health must be reported as-is rather than substituted to ∞.
    it('does not read it as debt-free when the position still carries debt', () => {
      render(<MarginAdjustBeforeAfterRows {...BASE} quote={EQUITY_ONLY_QUOTE} />)
      expect(screen.getByLabelText(/^Health factor: Healthy to /)).toBeInTheDocument()
    })

    // The SAME wire state carries a liquidationPrice of '0' — the backend derives it from the LTV, so
    // debt-free yields 0 on both fields. Rendering that as "$0.00" puts a liquidation an inch above
    // zero one row above the "Healthy" the case above asserts: two contradictory risk figures on one
    // card. The fixture above deliberately leaves the inherited non-zero price, which is why this
    // needs its own.
    it('withholds the liquidation price on the same debt-free sentinel it reads as Healthy', () => {
      render(
        <MarginAdjustBeforeAfterRows
          {...BASE}
          position={{ ...DEBT_FREE_POSITION, liquidationPrice: '0' }}
          quote={EQUITY_ONLY_QUOTE}
        />,
      )
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      // FiatTokenPrice renders a zero as "$0", NOT "$0.00" — the longer string never matches and the
      // assertion would pass with the sentinel right there on screen.
      expect(screen.queryByText('$0')).not.toBeInTheDocument()
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    // '0' is a truthy string, so the projection gate took the before/after branch and rendered an
    // after side of "$0.00" as though the quote had projected it.
    it('withholds a projected liquidation price stamped with the sentinel', () => {
      render(
        <MarginAdjustBeforeAfterRows
          {...BASE}
          quote={{ ...QUOTE, display: { ...QUOTE.display, liquidationPrice: '0' } }}
        />,
      )
      // FiatTokenPrice renders a zero as "$0", NOT "$0.00" — the longer string never matches and the
      // assertion would pass with the sentinel right there on screen.
      expect(screen.queryByText('$0')).not.toBeInTheDocument()
      // Degrades to the before-only row carrying the position's real price — the same treatment an
      // absent projection already gets, not an em dash: the CURRENT liquidation price is still known.
      expect(screen.getByText('$1,162.79')).toBeInTheDocument()
    })
  })

  // The projected liq price against the POSITION's oracle mark — a manage quote carries no
  // effectivePrice of its own. A long liquidates on a fall, so the suffix must read negative.
  it('signs the liquidation distance off the position mark', () => {
    const { getByText } = render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(getByText(/\(−22\.5%\)/)).toBeDefined()
  })

  it('renders a collapsed liquidation price with no unit prefix', () => {
    const { queryAllByText } = render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(queryAllByText(/1 ETH =/)).toHaveLength(0)
  })

  // addEquity/withdrawEquity hold size, so they report none — the current size is the projection, and
  // an arrow there would claim a move the action does not make.
  it('holds a row at its current value where the action reports no projection for it', () => {
    render(
      <MarginAdjustBeforeAfterRows {...BASE} quote={{ ...QUOTE, display: { ...QUOTE.display, size: undefined } }} />,
    )
    expect(screen.queryByLabelText(/^Size:/)).not.toBeInTheDocument()
    expect(screen.getByText('2.00 ETH')).toBeInTheDocument()
  })

  // display.size is EXPOSURE-denominated: dividing a short's 2 WETH by the 6dp collateral would print
  // it as 2,000,000,000,000.
  it('measures a SHORT size in exposure decimals, not collateral decimals', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} quote={SHORT_QUOTE} position={SHORT_POSITION} />)
    expect(screen.getByLabelText('Size: 2.00 ETH to 3.00 ETH')).toBeInTheDocument()
    expect(screen.queryByText(/2,000,000,000,000/)).not.toBeInTheDocument()
  })

  // The Size row's symbol reads the exposure leg (sizeLogos), never the collateral: the caller passes
  // the debt leg's symbol on a short. A regression to displaySymbol would print the ~$1 stable ticker.
  it('labels the Size row with the exposure leg symbol the caller supplies', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} sizeLogos={{ symbol: 'cbBTC' }} />)
    expect(screen.getByLabelText('Size: 2.00 cbBTC to 3.00 cbBTC')).toBeInTheDocument()
  })

  // Adjust and Change leverage put the target on a slider and the current figure in the pair heading,
  // so a third rendering of it in the summary was the drifted one nobody could place. Add and Withdraw
  // have no leverage control — there the move IS the payoff those modals advertise.
  it('drops the Leverage row where a leverage control already shows it', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} hasLeverageControl />)
    expect(labelOrder()).toEqual(['Size', 'Liquidates at'])
  })

  it('never renders Borrowing inline — it lives behind Show more now', () => {
    render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(screen.queryByText('Borrowing')).not.toBeInTheDocument()
  })

  // The server omits leverage (rather than a MAX_UINT256 sentinel) when there is no finite leverage
  // to report.
  it('shows an infinite leverage rather than a raw sentinel', () => {
    render(
      <MarginAdjustBeforeAfterRows
        {...BASE}
        quote={{ ...QUOTE, display: { ...QUOTE.display, leverage: undefined } }}
      />,
    )
    expect(screen.getByText('∞')).toBeInTheDocument()
  })
})

describe('MarginBorrowingRow', () => {
  const LONG_PROPS = { quote: QUOTE, position: POSITION, debtDecimals: 6, debtDisplaySymbol: 'USDC' }

  // The quote publishes no debt figure. A long borrows the slice of notional its equity does not fund:
  // 3 WETH × $2,000 × (1 − 1/3).
  it('projects a LONG debt from size, mark and leverage', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} />)
    expect(screen.getByText('Borrowing')).toBeInTheDocument()
    expect(screen.getByLabelText('Borrowing: 2,000.00 USDC to 4,000.00 USDC')).toBeInTheDocument()
  })

  // maxDebtIn is the slippage ceiling the plan may not exceed, not the debt this action takes on.
  it('never reports the slippage cap as the debt', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} />)
    expect(screen.queryByText(/9,999/)).not.toBeInTheDocument()
  })

  // A short's exposure IS its debt leg, so the projected size is already the projected debt.
  it('reads a SHORT debt straight off the projected size', () => {
    render(
      <MarginBorrowingRow quote={SHORT_QUOTE} position={SHORT_POSITION} debtDecimals={18} debtDisplaySymbol="ETH" />,
    )
    expect(screen.getByLabelText('Borrowing: 2.00 ETH to 3.00 ETH')).toBeInTheDocument()
  })

  // The keys that report no size are the equity-only ones, which hold debt constant.
  it('holds at the position debt when the action reports no size', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} quote={{ ...QUOTE, display: { ...QUOTE.display, size: undefined } }} />)
    expect(screen.queryByLabelText(/^Borrowing:/)).not.toBeInTheDocument()
    expect(screen.getByText('2,000.00 USDC')).toBeInTheDocument()
  })

  // The row read legs[0].bounds unguarded once; an empty legs array must not throw.
  it('renders against a quote carrying no legs', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} quote={{ ...QUOTE, legs: [] }} />)
    expect(screen.getByLabelText('Borrowing: 2,000.00 USDC to 4,000.00 USDC')).toBeInTheDocument()
  })

  it('shows the debt token logo when given one', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} logos={{ symbol: 'USDC', url: 'https://example.test/usdc.png' }} />)
    const logos = screen.getAllByTestId('token-logo')
    // One per value: the transition flanks both the before and the after.
    expect(logos.length).toBeGreaterThan(0)
    expect(logos[0]?.getAttribute('data-symbol')).toBe('USDC')
  })

  it('renders no logo when none is supplied', () => {
    render(<MarginBorrowingRow {...LONG_PROPS} />)
    expect(screen.queryAllByTestId('token-logo')).toHaveLength(0)
  })
})

describe('MarginAdjustBeforeAfterRowsSkeleton', () => {
  // The placeholder has to match the rows that will actually land, or first paint resizes the modal
  // the moment the quote arrives.
  it('sizes itself to the rows the caller will render', () => {
    const three = render(<MarginAdjustBeforeAfterRowsSkeleton rowCount={3} />)
    expect(three.getByTestId('margin-adjust-before-after-skeleton').children).toHaveLength(3)
    three.unmount()

    const four = render(<MarginAdjustBeforeAfterRowsSkeleton rowCount={4} />)
    expect(four.getByTestId('margin-adjust-before-after-skeleton').children).toHaveLength(4)
  })
})

// The suffix divides a FRESH quote price by the POLLED mark. While the mark is current that mix is
// honest; once it ages out the buffer is overstated, so the figure is withheld — the price itself still
// renders, which is exactly why this one is bounded rather than captioned like the impact row.
describe('MarginAdjustBeforeAfterRows — liquidation distance freshness', () => {
  it('reports the distance while the position mark is current', () => {
    const { container } = render(<MarginAdjustBeforeAfterRows {...BASE} />)
    expect(container.textContent).toMatch(/%\)/)
  })

  it('withholds the distance, but not the price, once the mark has aged out', () => {
    const { container } = render(<MarginAdjustBeforeAfterRows {...BASE} markIsStale />)
    expect(container.textContent).not.toMatch(/%\)/)
    expect(container.textContent).toMatch(/\$/)
  })
})

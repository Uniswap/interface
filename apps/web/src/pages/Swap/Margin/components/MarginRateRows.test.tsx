import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it, vi } from 'vitest'
import { marginMarketKey, type MarginMarket } from '~/constants/margin'
import { MarginRateRows } from '~/pages/Swap/Margin/components/MarginRateRows'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (
    selector: (s: { slippageToleranceBps: number; excludedVenues: string[]; pairKey: string }) => unknown,
  ) => selector({ slippageToleranceBps: 50, excludedVenues: [], pairKey: 'usdc-weth' }),
  useMarginFormStoreActions: () => ({ setMarginFormState: vi.fn() }),
}))

// The fixture quote below carries no paymentSwap route, so the route-symbol resolver never gets
// invoked — an empty registry avoids hitting the live markets query. The receipt's figures take their
// mark off the quote; the registry stays empty to prove it.
vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    markets: [],
    groups: [],
    getMarketByTokens: () => undefined,
    getLive: () => undefined,
    dataUpdatedAt: Date.now(),
  }),
}))

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const keyFor = (venue: MarginVenue): string => marginMarketKey({ collateralToken: USDC, debtToken: WETH, venue })

// A short: collateral is the USD-stable leg (USDC), debt is the volatile leg (WETH).
const SHORT_MARKET: MarginMarket = {
  key: keyFor('MORPHO'),
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'USDC',
  collateral: { address: USDC, symbol: 'USDC', decimals: 6 },
  debt: { address: WETH, symbol: 'WETH', decimals: 18 },
  venue: 'MORPHO',
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

const QUOTE: MarginQuoteResponse = {
  requestId: 'r1',
  action: 'open',
  chainId: 1,
  swapper: '0x0000000000000000000000000000000000000001',
  direction: MarginDirection.SHORT,
  exposureToken: { address: SHORT_MARKET.debt.address, chainId: 1, decimals: 18 },
  counterToken: { address: SHORT_MARKET.collateral.address, chainId: 1, decimals: 6 },
  display: { effectivePrice: `${3000n * 10n ** 18n}` },
  legs: [],
  deadlineSuggestion: '0',
  gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000' },
}

function derivedMarginInfoFixture(): DerivedMarginInfo {
  return {
    market: SHORT_MARKET,
    direction: MarginDirection.SHORT,
    quote: QUOTE,
    paymentToken: { symbol: 'USDC' },
  } as unknown as DerivedMarginInfo
}

describe('MarginRateRows', () => {
  // The receipt quotes the entry as a fiat price (the quote leg is the USD-stable one).
  it('shows the entry price as a fiat figure', () => {
    render(<MarginRateRows derivedMarginInfo={derivedMarginInfoFixture()} />)
    expect(screen.getByTestId(TestID.MarginReceipt)).toHaveTextContent('$3,000.00')
  })

  // '0' is the wire's absent sentinel and a truthy STRING: an unguarded read renders a $0.00 entry.
  it('hides the entry price rather than quoting the zero sentinel as a real one', () => {
    const info = derivedMarginInfoFixture()
    const zeroed = {
      ...info,
      quote: { ...QUOTE, display: { ...QUOTE.display, effectivePrice: '0' } },
    } as unknown as DerivedMarginInfo
    render(<MarginRateRows derivedMarginInfo={zeroed} />)
    expect(screen.getByTestId(TestID.MarginReceipt)).not.toHaveTextContent('$0.00')
    expect(screen.getByText('Entry price')).toBeInTheDocument()
  })

  it('renders nothing before there is a quote', () => {
    const { container } = render(
      <MarginRateRows derivedMarginInfo={{ ...derivedMarginInfoFixture(), quote: undefined }} />,
    )
    expect(container.textContent).toBe('')
  })

  // The quote's own oracle mark, 10% away from the fill, which clears the 5% warning threshold.
  const ORACLE_X18 = `${3300n * 10n ** 18n}`

  function renderWithDisplay(display: Partial<MarginQuoteResponse['display']>): HTMLElement {
    const info = derivedMarginInfoFixture()
    const quote = { ...QUOTE, display: { ...QUOTE.display, ...display } }
    return render(<MarginRateRows derivedMarginInfo={{ ...info, quote }} />).container
  }

  it('prices impact against the quote’s oracle mark', () => {
    const container = renderWithDisplay({ oraclePrice: ORACLE_X18 })
    expect(container.textContent).toContain('Price difference')
  })

  // '0' is the wire's "could not price"; read as a mark it would fabricate a 100% impact.
  it.each([undefined, '0'])('hides the impact row when the quote has no usable oracle mark (%s)', (oraclePrice) => {
    expect(renderWithDisplay({ oraclePrice }).textContent).not.toContain('Price difference')
  })

  // The mark is the quote's own snapshot, so there is no poll delay to disclose.
  it('leaves the impact row uncaptioned', () => {
    const container = renderWithDisplay({ oraclePrice: ORACLE_X18 })
    const captioned = [...container.querySelectorAll('[data-base-ui-tooltip-trigger]')].some((el) =>
      el.textContent.includes('Price difference'),
    )
    expect(captioned).toBe(false)
  })

  // Liquidation triggers off the ORACLE, and an open's fill is adverse to it — anchoring the distance on
  // the fill overstates the buffer. A short's $3,960 liquidation against the $3,300 oracle mark is
  // +20.0%; against the $3,000 fill it would read +32.0%.
  it('measures the liquidation distance against the quote’s oracle mark, not the fill', () => {
    renderWithDisplay({ oraclePrice: ORACLE_X18, liquidationPrice: `${3960n * 10n ** 18n}` })
    expect(screen.getByTestId(TestID.MarginReceipt)).toHaveTextContent('$3,960.00')
    expect(screen.getByText(/\(\+20\.0%\)/)).toBeInTheDocument()
    expect(screen.queryByText(/\(\+32\.0%\)/)).toBeNull()
  })

  // The PRICE comes off the quote and needs no mark; only the suffix does.
  it('still shows the liquidation price when the quote has no oracle mark', () => {
    renderWithDisplay({ liquidationPrice: `${3960n * 10n ** 18n}` })
    expect(screen.getByTestId(TestID.MarginReceipt)).toHaveTextContent('$3,960.00')
    // A signed distance suffix (the slippage chips also contain "%)", so match the sign).
    expect(screen.queryByText(/\([+−]\d+\.\d%\)/)).toBeNull()
  })

  // (−10.0%) is the $3,000 fill against the $3,300 mark.
  it('suffixes the Entry price with the impact against the oracle mark', () => {
    expect(renderWithDisplay({ oraclePrice: ORACLE_X18 }).textContent).toContain('(−10.0%)')
  })

  // A bridged quote's venue is provisional, so the receipt must not name it, or quote its rate, until
  // the real quote lands.
  function renderMarketRow({ isPlaceholderData }: { isPlaceholderData: boolean }): HTMLElement {
    const info = derivedMarginInfoFixture()
    const quote = {
      ...QUOTE,
      display: { ...QUOTE.display, borrowRate: `${4n * 10n ** 16n}` },
      legs: [{ venue: 'AAVE_V3', bounds: {} }],
    } as unknown as MarginQuoteResponse
    return render(<MarginRateRows derivedMarginInfo={{ ...info, quote, isPlaceholderData }} />).container
  }

  it('names the routed venue and its rate on a settled quote', () => {
    const container = renderMarketRow({ isPlaceholderData: false })
    expect(container.textContent).toContain('Aave v3')
    expect(container.textContent).toContain('4.0%')
  })

  it('withholds the venue and its rate while the quote is placeholder data', () => {
    const container = renderMarketRow({ isPlaceholderData: true })
    expect(container.textContent).not.toContain('Aave v3')
    expect(container.textContent).not.toContain('4.0%')
    expect(container.textContent).toContain('Auto · best available')
  })

  it('keeps the detail rows behind an arrow-only toggle that still has an accessible name', () => {
    render(<MarginRateRows derivedMarginInfo={derivedMarginInfoFixture()} />)
    const toggle = screen.getByRole('button', { name: 'Show more' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Show more')).toBeNull()
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
  })
})

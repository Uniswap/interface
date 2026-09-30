import { CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { TestID } from '@universe/test'
import { getExactSharePercent } from 'uniswap/src/features/positions/utils'
import { LiquidityPositionStackedBars } from '~/features/Liquidity/LiquidityPositionStackedBars'
import { render, screen } from '~/test-utils/render'

const USDC = new Token(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin')
const WETH = new Token(8453, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether')

const currencyInfo = (currency: Token) => ({ currency, currencyId: currency.address, logoUrl: null }) as never

function renderBars(values: Percent[]): void {
  render(
    <LiquidityPositionStackedBars
      bars={values.map((value, i) => {
        const currency = i === 0 ? WETH : USDC
        return { id: currency.address, value, currencyInfo: currencyInfo(currency) }
      })}
    />,
  )
}

// PositionPage derives its bar percentages from `useUSDCValue` amounts, which are fractional
// (`Price.quote` keeps a denominator). A position worth less than one raw unit of the chain's
// stablecoin — a token priced so low that the price service scales its base amount by 1e36 —
// floors to a zero `quotient` on both sides, so the pre-fix expression built `new Percent(0, 0)`.
describe('LiquidityPositionStackedBars', () => {
  const tinyPricedToken = new Price({
    baseAmount: CurrencyAmount.fromRawAmount(WETH, (10n ** 18n * 10n ** 36n).toString()),
    quoteAmount: CurrencyAmount.fromRawAmount(USDC, '1000000'),
  })
  const fiatValue0 = tinyPricedToken.quote(CurrencyAmount.fromRawAmount(WETH, '1360061562974125'))
  const fiatValue1 = CurrencyAmount.fromRawAmount(USDC, 0)
  const totalFiatValue = fiatValue0.add(fiatValue1)

  it('values the position above zero as a fraction but below one raw stablecoin unit', () => {
    expect(totalFiatValue.greaterThan(0)).toBe(true)
    expect(totalFiatValue.quotient.toString()).toBe('0')
  })

  it('tolerates a zero-denominator percent without throwing', () => {
    renderBars([
      new Percent(fiatValue0.quotient, totalFiatValue.quotient),
      new Percent(fiatValue1.quotient, totalFiatValue.quotient),
    ])

    // Both collapse to 0/0, which `equalTo(new Percent(0, 100))` reports as zero, so toFixed is
    // never reached. This is the only reason a sub-base-unit position never crashed this chart.
    expect(screen.getAllByText('0%')).toHaveLength(2)
  })

  // A pool incentivized in one of its own tokens earns fees and rewards in the same currency, so
  // the token alone can't identify a segment — each `BarSlice` holds extracted-color state under
  // its key, and a duplicate would have two slices sharing one identity.
  it('keeps segments distinct when a reward token is also a pool token', () => {
    render(
      <LiquidityPositionStackedBars
        bars={[
          { id: `fee-${WETH.address}`, value: new Percent(1, 2), currencyInfo: currencyInfo(WETH) },
          { id: `reward-${WETH.address}`, value: new Percent(1, 2), currencyInfo: currencyInfo(WETH) },
        ]}
      />,
    )

    expect(screen.getAllByTestId(TestID.LiquidityPositionStackedBarSegment)).toHaveLength(2)
  })

  it('renders the exact split for a position worth less than one raw stablecoin unit', () => {
    const percent0 = getExactSharePercent(fiatValue0, totalFiatValue)
    const percent1 = getExactSharePercent(fiatValue1, totalFiatValue)
    expect(percent0).toBeDefined()
    expect(percent1).toBeDefined()

    renderBars([percent0!, percent1!])

    expect(screen.getByText('100%')).toBeDefined()
    expect(screen.getByText('0%')).toBeDefined()
  })
})

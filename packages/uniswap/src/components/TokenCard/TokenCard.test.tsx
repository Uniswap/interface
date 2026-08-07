import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const mockLocale = Locale.EnglishUnitedStates

vi.mock('uniswap/src/features/language/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/language/hooks')>()
  return {
    ...actual,
    useCurrentLocale: (): Locale => mockLocale,
  }
})

const mockFiatCurrencyInfo: FiatCurrencyInfo = {
  name: 'United States Dollar',
  shortName: 'USD ($)',
  code: 'USD',
  symbol: '$',
  groupingSeparator: ',',
  decimalSeparator: '.',
  fullSymbol: '$',
  symbolAtFront: true,
}

vi.mock('uniswap/src/features/fiatCurrency/hooks', () => ({
  useAppFiatCurrencyInfo: (): FiatCurrencyInfo => mockFiatCurrencyInfo,
}))

const sparkline: ChartPoint[] = [
  { timestamp: 0, value: 10 },
  { timestamp: 100, value: 12 },
  { timestamp: 200, value: 11 },
  { timestamp: 300, value: 14 },
]

describe('TokenCard', () => {
  it('renders the vertical layout with price, issuer label and positive delta', () => {
    const tree = render(
      <TokenCard
        issuerLabel="Robinhood"
        layout="vertical"
        logoUrl="https://example.com/logo.png"
        name="Amazon"
        pricePercentChange1d={7.55}
        priceUsd={257.62}
        sparkline={sparkline}
        symbol="AMZN"
        width={204}
      />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders the vertical layout with a negative delta and no issuer label', () => {
    const tree = render(
      <TokenCard
        layout="vertical"
        name="Micron Technology"
        pricePercentChange1d={-9.03}
        priceUsd={900.63}
        sparkline={sparkline}
        symbol="MU"
        width={168}
      />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders the horizontal layout without a price', () => {
    const tree = render(
      <TokenCard
        layout="horizontal"
        name="Solstice"
        pricePercentChange1d={6.45}
        sparkline={sparkline}
        symbol="SLX"
        width={280}
      />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders a spacer instead of a sparkline for fewer than 2 points', () => {
    const tree = render(
      <TokenCard
        layout="vertical"
        name="SanDisk"
        pricePercentChange1d={9.67}
        priceUsd={1594.61}
        sparkline={[]}
        symbol="SNDK"
        width={204}
      />,
    )
    expect(tree.getByTestId('token-card-sparkline-empty')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('fires onPress when pressed', () => {
    const onPress = vi.fn()
    const tree = render(
      <TokenCard
        layout="vertical"
        name="Alphabet"
        pricePercentChange1d={3.63}
        priceUsd={372.5}
        sparkline={sparkline}
        symbol="GOOG"
        testID="token-card"
        width={204}
        onPress={onPress}
      />,
    )
    fireEvent.press(tree.getByTestId('token-card'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

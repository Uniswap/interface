import { UniverseChainId } from '@universe/chains'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { fireEvent, render } from 'uniswap/src/test/test-utils'

const mockLocale = Locale.EnglishUnitedStates

const { mockIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockIsTokenCategoriesEnabled: vi.fn(() => false) }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: () => mockIsTokenCategoriesEnabled(),
}))

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
        issuer={{ issuer: 'robinhood', issuerDisplayName: 'Robinhood' }}
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

  it('shows the network badge for the given chain, including mainnet', () => {
    const tree = render(
      <TokenCard
        chainId={UniverseChainId.Mainnet}
        layout="horizontal"
        name="Uniswap"
        sparkline={sparkline}
        symbol="UNI"
        width={280}
      />,
    )
    expect(tree.getByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeTruthy()
  })

  it('hides the network badge when hideNetworkLogo is set', () => {
    const tree = render(
      <TokenCard
        hideNetworkLogo
        chainId={UniverseChainId.Base}
        layout="horizontal"
        name="Uniswap"
        sparkline={sparkline}
        symbol="UNI"
        width={280}
      />,
    )
    expect(tree.queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
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

  describe('sparkline scaling by stablecoin category', () => {
    const wobble: ChartPoint[] = [
      { timestamp: 0, value: 1.0002 },
      { timestamp: 100, value: 0.9998 },
      { timestamp: 200, value: 1.0001 },
      { timestamp: 300, value: 0.9999 },
    ]

    const lineMinMaxY = (categoryIds?: string[]): [number, number] => {
      render(
        <TokenCard
          categoryIds={categoryIds}
          layout="horizontal"
          name="Tether USD"
          pricePercentChange1d={-0.02}
          sparkline={wobble}
          symbol="USDT"
          width={280}
        />,
      )
      const line = document.querySelector('[d][fill="none"]')
      // d3 paths are `M x,y` / `C x1,y1,x2,y2,x,y`: every second number in a command is a y
      const ys = [...String(line?.getAttribute('d')).matchAll(/[MLC]([^MLCZ]+)/g)].flatMap((match) =>
        (match[1] ?? '')
          .split(',')
          .filter((_, i) => i % 2 === 1)
          .map(Number),
      )
      expect(ys.length).toBeGreaterThan(1)
      return [Math.min(...ys), Math.max(...ys)]
    }

    it('flattens a stablecoin-tagged token around the middle of the 40px chart', () => {
      mockIsTokenCategoriesEnabled.mockReturnValue(true)
      const [minY, maxY] = lineMinMaxY(['majors', 'stablecoins'])

      expect(minY).toBeGreaterThan(18)
      expect(maxY).toBeLessThan(22)
    })

    it('keeps full-height scaling for a non-stablecoin with the same tiny move', () => {
      mockIsTokenCategoriesEnabled.mockReturnValue(true)
      const [minY, maxY] = lineMinMaxY(['majors'])

      expect(minY).toBeLessThan(3)
      expect(maxY).toBeGreaterThan(37)
    })

    it('keeps full-height scaling while Token Categories is off', () => {
      mockIsTokenCategoriesEnabled.mockReturnValue(false)
      const [minY, maxY] = lineMinMaxY(['stablecoins'])

      expect(minY).toBeLessThan(3)
      expect(maxY).toBeGreaterThan(37)
    })
  })
})

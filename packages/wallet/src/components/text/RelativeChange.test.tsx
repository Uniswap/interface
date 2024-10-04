import renderer from 'react-test-renderer'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { TamaguiProvider } from 'wallet/src/providers/tamagui-provider'

// Needs to be imported after the mock localization context
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'

const mockLocale = Locale.EnglishUnitedStates

jest.mock('uniswap/src/features/language/hooks', () => {
  return {
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

jest.mock('uniswap/src/features/fiatCurrency/hooks', () => {
  return {
    useAppFiatCurrencyInfo: (): FiatCurrencyInfo => mockFiatCurrencyInfo,
  }
})

it('renders a relative change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange change={12} />
    </TamaguiProvider>,
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange />
    </TamaguiProvider>,
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders with absolute change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange absoluteChange={100} change={12} />
    </TamaguiProvider>,
  )
  expect(tree).toMatchSnapshot()
})

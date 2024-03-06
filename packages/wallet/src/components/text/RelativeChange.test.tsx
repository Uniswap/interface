import renderer from 'react-test-renderer'
import { FiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { Locale } from 'wallet/src/features/language/constants'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'
import { mockLocalizationContext } from 'wallet/src/test/mocks'
import { RelativeChange } from './RelativeChange'

const mockLocale = Locale.EnglishUnitedStates

jest.mock('wallet/src/features/language/hooks', () => {
  return {
    useCurrentLocale: (): Locale => mockLocale,
  }
})

const mockFiatCurrencyInfo: FiatCurrencyInfo = {
  name: 'United States Dollar',
  code: 'USD',
  symbol: '$',
  groupingSeparator: ',',
  decimalSeparator: '.',
  fullSymbol: '$',
  symbolAtFront: true,
}

jest.mock('wallet/src/features/fiatCurrency/hooks', () => {
  return {
    useAppFiatCurrencyInfo: (): FiatCurrencyInfo => mockFiatCurrencyInfo,
  }
})

jest.mock('wallet/src/features/language/LocalizationContext', () => mockLocalizationContext)

it('renders a relative change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange change={12} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders placeholders with absolute change', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <RelativeChange absoluteChange={100} change={12} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

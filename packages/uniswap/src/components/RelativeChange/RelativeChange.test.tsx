import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { Locale } from 'uniswap/src/features/language/constants'
import { renderWithProviders } from 'uniswap/src/test/render'

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

it('renders a relative change', () => {
  const tree = renderWithProviders(<RelativeChange change={12} />)
  expect(tree).toMatchSnapshot()
})

it('renders placeholders without a change', () => {
  const tree = renderWithProviders(<RelativeChange />)
  expect(tree).toMatchSnapshot()
})

it('renders placeholders with absolute change', () => {
  const tree = renderWithProviders(<RelativeChange absoluteChange={100} change={12} />)
  expect(tree).toMatchSnapshot()
})

it('shows a preformatted absolute change in place of the balance formatting', () => {
  const { getByText } = renderWithProviders(
    <RelativeChange change={23} absoluteChange={0.000023} formattedAbsoluteChange="$0.000023" />,
  )
  expect(getByText('$0.000023 (23%)')).toBeTruthy()
})

it('formats the absolute change as a balance without a preformatted one', () => {
  const { getByText } = renderWithProviders(<RelativeChange change={23} absoluteChange={0.000023} />)
  expect(getByText('$0.00 (23%)')).toBeTruthy()
})

it('shows only the percent when the absolute change is zero, even with a preformatted one', () => {
  const { getByText, queryByText } = renderWithProviders(
    <RelativeChange change={0} absoluteChange={0} formattedAbsoluteChange="$0.00" />,
  )
  expect(getByText('0%')).toBeTruthy()
  expect(queryByText(/\$/)).toBeNull()
})

import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'uniswap/src/test/fixtures'
import { renderWithProviders } from 'wallet/src/test/render'

jest.mock('ui/src/assets/', () => 'ethereum-logo.png')

// TODO(WEB-4275): Move this test and fixtures to uniswap package

it('renders a currency logo without network logo', () => {
  const tree = renderWithProviders(<CurrencyLogo currencyInfo={uniCurrencyInfo()} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = renderWithProviders(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo()} size={20} />)
  expect(tree).toMatchSnapshot()
})

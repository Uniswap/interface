import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'wallet/src/test/fixtures'
import { renderWithProviders } from 'wallet/src/test/render'

jest.mock('ui/src/assets/', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = renderWithProviders(<CurrencyLogo currencyInfo={uniCurrencyInfo()} size={20} />)
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = renderWithProviders(
    <CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo()} size={20} />
  )
  expect(tree).toMatchSnapshot()
})

import renderer from 'react-test-renderer'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { TamaguiProvider } from 'wallet/src/provider/tamagui-provider'
import { arbitrumDaiCurrencyInfo, uniCurrencyInfo } from 'wallet/src/test/fixtures'

jest.mock('ui/src/assets/', () => 'ethereum-logo.png')

it('renders a currency logo without network logo', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <CurrencyLogo currencyInfo={uniCurrencyInfo} size={20} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders a currency logo with network logo', () => {
  const tree = renderer.create(
    <TamaguiProvider>
      <CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo} size={20} />
    </TamaguiProvider>
  )
  expect(tree).toMatchSnapshot()
})

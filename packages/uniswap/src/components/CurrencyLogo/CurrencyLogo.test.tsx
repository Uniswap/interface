import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { ARBITRUM_DAI_CURRENCY_INFO, arbitrumDaiCurrencyInfo, UNI_CURRENCY_INFO } from 'uniswap/src/test/fixtures'
import { renderWithProviders } from 'uniswap/src/test/render'
import { render } from 'uniswap/src/test/test-utils'

jest.mock('ui/src/components/UniversalImage/internal/PlainImage', () => ({
  ...jest.requireActual('ui/src/components/UniversalImage/internal/PlainImage.web'),
}))

describe(CurrencyLogo, () => {
  it('renders without error', () => {
    const tree = render(<CurrencyLogo currencyInfo={UNI_CURRENCY_INFO} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a currency logo with network logo', () => {
    const tree = render(<CurrencyLogo currencyInfo={ARBITRUM_DAI_CURRENCY_INFO} />)

    expect(tree).toMatchSnapshot()
  })

  describe('network logo', () => {
    it('is rendered by default', () => {
      const { queryByTestId } = renderWithProviders(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo()} />)

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('is rendered if hideNetworkLogo is false', () => {
      const { queryByTestId } = renderWithProviders(
        <CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo()} hideNetworkLogo={false} />,
      )

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('is not rendered if hideNetworkLogo is true', () => {
      const { queryByTestId } = render(<CurrencyLogo hideNetworkLogo currencyInfo={arbitrumDaiCurrencyInfo()} />)

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeFalsy()
    })
  })
})

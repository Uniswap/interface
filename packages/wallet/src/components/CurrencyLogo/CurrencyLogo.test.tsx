import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { ARBITRUM_DAI_CURRENCY_INFO, UNI_CURRENCY_INFO, arbitrumDaiCurrencyInfo } from 'uniswap/src/test/fixtures'
import { render } from 'wallet/src/test/test-utils'

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
      const { queryByTestId } = render(<CurrencyLogo currencyInfo={arbitrumDaiCurrencyInfo()} />)

      const networkLogo = queryByTestId('network-logo')

      expect(networkLogo).toBeTruthy()
    })

    it('is rendered if hideNetworkLogo is false', () => {
      const { queryByTestId } = render(
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

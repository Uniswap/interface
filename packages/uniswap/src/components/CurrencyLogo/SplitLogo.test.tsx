import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { DAI_CURRENCY_INFO, daiCurrencyInfo, ETH_CURRENCY_INFO, ethCurrencyInfo } from 'uniswap/src/test/fixtures'
import { render, within } from 'uniswap/src/test/test-utils'

const arbitrumNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.ArbitrumOne}`
const mainnetNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.Mainnet}`

describe(SplitLogo, () => {
  it('renders without error', () => {
    const tree = render(
      <SplitLogo
        chainId={UniverseChainId.ArbitrumOne}
        inputCurrencyInfo={DAI_CURRENCY_INFO}
        outputCurrencyInfo={ETH_CURRENCY_INFO}
        size={10}
      />,
    )

    expect(tree).toMatchSnapshot()
  })

  describe('input currency logo', () => {
    it('renders input currency logo when inputCurrencyInfo is specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      const inputCurrencyLogo = getByTestId('input-currency-logo-container')

      expect(within(inputCurrencyLogo).queryByTestId('token-logo')).toBeTruthy()
    })

    it('renders input currency logo when inputCurrencyInfo is not specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={null}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      const inputCurrencyLogo = getByTestId('input-currency-logo-container')

      expect(within(inputCurrencyLogo).queryByTestId('token-logo')).toBeFalsy()
    })
  })

  describe('output currency logo', () => {
    it('renders output currency logo when outputCurrencyInfo is specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      const outputCurrencyLogo = getByTestId('output-currency-logo-container')

      expect(within(outputCurrencyLogo).queryByTestId('token-logo')).toBeTruthy()
    })

    it('renders output currency logo when outputCurrencyInfo is not specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={null}
          size={10}
        />,
      )

      const outputCurrencyLogo = getByTestId('output-currency-logo-container')

      expect(within(outputCurrencyLogo).queryByTestId('token-logo')).toBeFalsy()
    })
  })

  describe('icon', () => {
    it('renders icon when chainId is specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      const icon = getByTestId(arbitrumNetworkLogoTestID)

      expect(icon).toBeTruthy()
    })

    it('does not render icon when chainId is not specified', () => {
      const { queryByTestId } = render(
        <SplitLogo
          chainId={null}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      const icon = queryByTestId(arbitrumNetworkLogoTestID)

      expect(icon).toBeFalsy()
    })

    it('renders icon for Mainnet', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.Mainnet}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      expect(getByTestId(mainnetNetworkLogoTestID)).toBeTruthy()
    })
  })

  describe('stacked orientation', () => {
    it('renders without error', () => {
      const tree = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={DAI_CURRENCY_INFO}
          outputCurrencyInfo={ETH_CURRENCY_INFO}
          orientation="stacked"
          size={10}
        />,
      )

      expect(tree).toMatchSnapshot()
    })

    it('renders icon when chainId is specified', () => {
      const { getByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.ArbitrumOne}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          orientation="stacked"
          size={10}
        />,
      )

      expect(getByTestId(arbitrumNetworkLogoTestID)).toBeTruthy()
    })

    it('does not render icon when chainId is not specified', () => {
      const { queryByTestId } = render(
        <SplitLogo
          chainId={null}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          orientation="stacked"
          size={10}
        />,
      )

      expect(queryByTestId(arbitrumNetworkLogoTestID)).toBeFalsy()
    })
  })
})

import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DAI_CURRENCY_INFO, daiCurrencyInfo, ETH_CURRENCY_INFO, ethCurrencyInfo } from 'uniswap/src/test/fixtures'
import { render, within } from 'uniswap/src/test/test-utils'

jest.mock('ui/src/components/UniversalImage/internal/PlainImage', () => ({
  ...jest.requireActual('ui/src/components/UniversalImage/internal/PlainImage.web'),
}))

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

      const icon = getByTestId('network-logo')

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

      const icon = queryByTestId('network-logo')

      expect(icon).toBeFalsy()
    })
  })
})

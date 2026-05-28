import { useFeatureFlag } from '@universe/gating'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DAI_CURRENCY_INFO, daiCurrencyInfo, ETH_CURRENCY_INFO, ethCurrencyInfo } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { render, within } from 'uniswap/src/test/test-utils'

const arbitrumNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.ArbitrumOne}`
const mainnetNetworkLogoTestID = `${TestID.NetworkLogoPrefix}${UniverseChainId.Mainnet}`

vi.mock('ui/src/components/UniversalImage/internal/PlainImage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src/components/UniversalImage/internal/PlainImage.web')>()
  return { ...actual }
})

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

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
    beforeEach(() => {
      vi.mocked(useFeatureFlag).mockReturnValue(false)
    })

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

    it('does not render icon for Mainnet when multichain token UX is disabled', () => {
      const { queryByTestId } = render(
        <SplitLogo
          chainId={UniverseChainId.Mainnet}
          inputCurrencyInfo={daiCurrencyInfo()}
          outputCurrencyInfo={ethCurrencyInfo()}
          size={10}
        />,
      )

      expect(queryByTestId(mainnetNetworkLogoTestID)).toBeFalsy()
    })

    it('renders icon for Mainnet when multichain token UX is enabled', () => {
      vi.mocked(useFeatureFlag).mockReturnValue(true)
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
})

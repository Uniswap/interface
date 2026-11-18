import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { getTokenLogoProps } from 'uniswap/src/components/CurrencyLogo/getTokenLogoProps'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ARBITRUM_DAI_CURRENCY_INFO, currencyInfo, ETH_CURRENCY_INFO } from 'uniswap/src/test/fixtures'

describe(getTokenLogoProps, () => {
  it('maps the logo, symbol and name, with the network badge on mainnet too', () => {
    const { currency } = ETH_CURRENCY_INFO
    expect(getTokenLogoProps(ETH_CURRENCY_INFO)).toEqual({
      url: ETH_CURRENCY_INFO.logoUrl,
      symbol: currency.symbol,
      name: currency.name,
      isTestnet: false,
      badge: {
        kind: 'network',
        logo: getChainInfo(UniverseChainId.Mainnet).logo,
        testID: `${TestID.NetworkLogoPrefix}${UniverseChainId.Mainnet}`,
      },
    })
  })

  it('badges the token chain', () => {
    expect(getTokenLogoProps(ARBITRUM_DAI_CURRENCY_INFO).badge).toMatchObject({
      kind: 'network',
      testID: `${TestID.NetworkLogoPrefix}${UniverseChainId.ArbitrumOne}`,
    })
  })

  it('marks testnet tokens and drops a missing logo url', () => {
    const sepoliaEth = currencyInfo({ nativeCurrency: nativeOnChain(UniverseChainId.Sepolia), logoUrl: null })
    expect(getTokenLogoProps(sepoliaEth)).toMatchObject({ isTestnet: true, url: undefined })
  })
})

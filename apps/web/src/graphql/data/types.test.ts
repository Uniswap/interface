import { ChainId } from '@uniswap/sdk-core'
import { DAI, NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { Chain, SafetyLevel, Token, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'

const MAINNET_NATIVE_GQL_TOKEN = {
  __typename: 'Token',
  chain: Chain.Ethereum,
  decimals: 18,
  id: NATIVE_CHAIN_ID,
  address: NATIVE_CHAIN_ID,
  name: 'Ethereum',
  standard: TokenStandard.Native,
  symbol: 'ETH',
  project: {
    __typename: 'TokenProject',
    id: '0x',
    tokens: [],
    isSpam: false,
    safetyLevel: SafetyLevel.Verified,
    logo: {
      id: '0x',
      url: 'eth_url',
    },
  },
} as Token

const MAINNET_NATIVE_CURRENCY_INFO = {
  currency: nativeOnChain(ChainId.MAINNET),
  currencyId: 'ETH',
  isSpam: false,
  logoUrl: 'eth_url',
  safetyLevel: SafetyLevel.Verified,
}

describe('gqlTokenToCurrencyInfo', () => {
  it('should return undefined if currency has an unsupported chain', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      id: '0x',
      chain: 'invalid_chain' as Chain,
    })
    expect(result).toBeUndefined()
  })

  it('should return native CurrencyInfo with defaults if missing fields', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      id: '0x',
      chain: Chain.Ethereum,
    })
    expect(result).toEqual({
      ...MAINNET_NATIVE_CURRENCY_INFO,
      logoUrl: undefined,
      safetyLevel: SafetyLevel.StrongWarning,
    })
  })

  it('should return the native CurrencyInfo for token with standard = native', () => {
    const result = gqlTokenToCurrencyInfo({
      ...MAINNET_NATIVE_GQL_TOKEN,
      address: undefined,
    })
    expect(result).toEqual(MAINNET_NATIVE_CURRENCY_INFO)
  })

  it('should return the native CurrencyInfo for token with NATIVE address and no standard', () => {
    const result = gqlTokenToCurrencyInfo({
      ...MAINNET_NATIVE_GQL_TOKEN,
      standard: undefined,
    })
    expect(result).toEqual(MAINNET_NATIVE_CURRENCY_INFO)
  })

  it('should return the native CurrencyInfo for token with no address or standard', () => {
    const result = gqlTokenToCurrencyInfo({
      ...MAINNET_NATIVE_GQL_TOKEN,
      standard: undefined,
      address: undefined,
    })
    expect(result).toEqual(MAINNET_NATIVE_CURRENCY_INFO)
  })

  it('should throw for an invalid non-native token', () => {
    expect(() =>
      gqlTokenToCurrencyInfo({
        __typename: 'Token',
        chain: Chain.Ethereum,
        decimals: 18,
        id: '0x',
        address: '0x',
        name: 'test token',
        standard: 'invalid_standard' as TokenStandard,
        symbol: 'TKN',
        project: {
          __typename: 'TokenProject',
          id: '0x',
          tokens: [],
          isSpam: false,
          safetyLevel: SafetyLevel.Verified,
          logo: {
            id: '0x',
            url: 'dai_url',
          },
        },
      })
    ).toThrow()
  })

  it('should return a non-native CurrencyInfo', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      chain: Chain.Ethereum,
      decimals: DAI.decimals,
      id: DAI.address,
      address: DAI.address,
      name: DAI.name,
      standard: TokenStandard.Erc20,
      symbol: DAI.symbol,
      project: {
        __typename: 'TokenProject',
        id: DAI.address,
        tokens: [],
        isSpam: false,
        safetyLevel: SafetyLevel.Verified,
        logo: {
          id: DAI.address,
          url: 'dai_url',
        },
      },
    })
    expect(result).toEqual({
      currency: DAI,
      currencyId: DAI.address,
      isSpam: false,
      logoUrl: 'dai_url',
      safetyLevel: SafetyLevel.Verified,
    })
  })
})

import { gqlTokenToCurrencyInfo } from 'appGraphql/data/types'
import { GraphQLApi } from '@universe/api'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { DAI, nativeOnChain, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { removeSafetyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { currencyId } from 'uniswap/src/utils/currencyId'

const MAINNET_NATIVE_GQL_TOKEN = {
  __typename: 'Token',
  chain: GraphQLApi.Chain.Ethereum,
  decimals: 18,
  id: NATIVE_CHAIN_ID,
  address: NATIVE_CHAIN_ID,
  name: 'Ethereum',
  standard: GraphQLApi.TokenStandard.Native,
  symbol: 'ETH',
  project: {
    __typename: 'TokenProject',
    id: '0x',
    tokens: [],
    isSpam: false,
    safetyLevel: GraphQLApi.SafetyLevel.Verified,
    logo: {
      id: '0x',
      url: 'eth_url',
    },
  },
  protectionInfo: {
    result: GraphQLApi.ProtectionResult.Benign,
  },
} as GraphQLApi.Token

const MAINNET_NATIVE_CURRENCY_INFO = {
  currency: nativeOnChain(UniverseChainId.Mainnet),
  currencyId: currencyId(nativeOnChain(UniverseChainId.Mainnet)),
  isSpam: false,
  logoUrl: 'eth_url',
  safetyInfo: {
    tokenList: TokenList.Default,
    protectionResult: GraphQLApi.ProtectionResult.Benign,
    attackType: undefined,
    blockaidFees: undefined,
  },
}

describe('gqlTokenToCurrencyInfo', () => {
  it('should return undefined if currency has an unsupported chain', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      id: '0x',
      chain: 'invalid_chain' as GraphQLApi.Chain,
    })
    expect(result).toBeUndefined()
  })

  it('should return native CurrencyInfo with defaults if missing fields', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      id: '0x',
      chain: GraphQLApi.Chain.Ethereum,
    })
    expect(result).toEqual({
      ...MAINNET_NATIVE_CURRENCY_INFO,
      logoUrl: undefined,
      safetyInfo: {
        protectionResult: GraphQLApi.ProtectionResult.Unknown,
        tokenList: TokenList.NonDefault,
        attackType: undefined,
        blockaidFees: undefined,
      },
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
        chain: GraphQLApi.Chain.Ethereum,
        decimals: 18,
        id: '0x',
        address: '0x',
        name: 'test token',
        standard: 'invalid_standard' as GraphQLApi.TokenStandard,
        symbol: 'TKN',
        project: {
          __typename: 'TokenProject',
          id: '0x',
          tokens: [],
          isSpam: false,
          safetyLevel: GraphQLApi.SafetyLevel.Verified,
          logo: {
            id: '0x',
            url: 'dai_url',
          },
        },
      }),
    ).toThrow()
  })

  it('should return a non-native CurrencyInfo', () => {
    const result = gqlTokenToCurrencyInfo({
      __typename: 'Token',
      chain: GraphQLApi.Chain.Ethereum,
      decimals: DAI.decimals,
      id: DAI.address,
      address: DAI.address,
      name: DAI.name,
      standard: GraphQLApi.TokenStandard.Erc20,
      symbol: DAI.symbol,
      project: {
        __typename: 'TokenProject',
        id: DAI.address,
        tokens: [],
        isSpam: false,
        safetyLevel: GraphQLApi.SafetyLevel.Verified,
        logo: {
          id: DAI.address,
          url: 'dai_url',
        },
      },
    })
    expect(removeSafetyInfo(result)).toEqual({
      currency: DAI,
      currencyId: currencyId(DAI),
      isSpam: false,
      logoUrl: 'dai_url',
    })
  })

  it('should return a CurrencyInfo with fields missing', () => {
    const result = gqlTokenToCurrencyInfo({
      id: USDC_MAINNET.address,
      address: USDC_MAINNET.address,
      chain: GraphQLApi.Chain.Ethereum,
    })
    expect(removeSafetyInfo(result)).toEqual({
      currency: {
        ...USDC_MAINNET,
        decimals: 18, // default since it's missing
        name: undefined, // default since it's missing
        symbol: undefined, // default since it's missing
      },
      currencyId: currencyId(USDC_MAINNET),
      isSpam: false,
      logoUrl: undefined,
    })
  })
})

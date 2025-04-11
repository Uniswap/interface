import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { DAI, USDC_MAINNET, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Chain,
  ProtectionResult,
  SafetyLevel,
  Token,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { removeSafetyInfo } from 'uniswap/src/test/fixtures'

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
  protectionInfo: {
    result: ProtectionResult.Benign,
  },
} as Token

const MAINNET_NATIVE_CURRENCY_INFO = {
  currency: nativeOnChain(UniverseChainId.Mainnet),
  currencyId: 'ETH',
  isSpam: false,
  logoUrl: 'eth_url',
  safetyInfo: {
    tokenList: TokenList.Default,
    protectionResult: ProtectionResult.Benign,
    attackType: undefined,
    blockaidFees: undefined,
  },
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
      safetyInfo: {
        protectionResult: ProtectionResult.Unknown,
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
      }),
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
    expect(removeSafetyInfo(result)).toEqual({
      currency: DAI,
      currencyId: DAI.address,
      isSpam: false,
      logoUrl: 'dai_url',
    })
  })

  it('should return a CurrencyInfo with fields missing', () => {
    const result = gqlTokenToCurrencyInfo({
      id: USDC_MAINNET.address,
      address: USDC_MAINNET.address,
      chain: Chain.Ethereum,
    })
    expect(removeSafetyInfo(result)).toEqual({
      currency: {
        ...USDC_MAINNET,
        decimals: 18, // default since it's missing
        name: undefined, // default since it's missing
        symbol: undefined, // default since it's missing
      },
      currencyId: USDC_MAINNET.address,
      isSpam: false,
      logoUrl: undefined,
    })
  })
})

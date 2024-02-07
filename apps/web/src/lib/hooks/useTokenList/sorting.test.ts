import { ChainId, Token as InterfaceToken } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET, USDT, WBTC, nativeOnChain } from 'constants/tokens'
import { Chain, Currency, Token, TokenBalance, TokenStandard } from 'graphql/data/__generated__/types-and-hooks'

import { getSortedPortfolioTokens, tokenQuerySortComparator } from './sorting'

const nativeToken: Token = {
  id: 'native-token',
  chain: Chain.Ethereum,
  standard: TokenStandard.Native,
  decimals: 18,
  address: 'ETH',
}

const nonnativeToken = (token: InterfaceToken) => ({
  id: 'nonnative-token',
  chain: Chain.Ethereum,
  standard: TokenStandard.Erc20,
  address: token.address,
  decimals: token.decimals,
  name: token.name,
  symbol: token.symbol,
})

const tokens: TokenBalance[] = [
  // 0.5 ETH
  {
    id: 'low-balance-native',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      value: 0.5,
    },
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [nativeToken],
        isSpam: false,
      },
    },
    token: nativeToken,
  },
  // 0.01 DAI
  {
    id: 'low-balance-nonnative',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      currency: Currency.Usd,
      value: 0.01,
    },
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [nonnativeToken(DAI)],
        isSpam: false,
      },
    },
    token: nonnativeToken(DAI),
  },
  // 100 USDC, but marked as spam
  {
    id: 'spam',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      value: 100,
    },
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [nonnativeToken(USDC_MAINNET)],
        isSpam: true,
      },
    },
    token: nonnativeToken(USDC_MAINNET),
  },
  // 100 USDT
  {
    id: 'valid',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      value: 100,
    },
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [nonnativeToken(USDT)],
        isSpam: false,
      },
    },
    token: nonnativeToken(USDT),
  },
  // empty balance for WBTC
  {
    id: 'undefined-value',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      // @ts-ignore this is evidently possible but not represented in our types
      value: undefined,
    },
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [nonnativeToken(WBTC)],
        isSpam: false,
      },
    },
    token: nonnativeToken(WBTC),
  },
]

describe('sorting', () => {
  describe('getSortedPortfolioTokens', () => {
    it('should return an empty array if portfolioTokenBalances is undefined', () => {
      const result = getSortedPortfolioTokens(undefined, {}, ChainId.MAINNET)
      expect(result).toEqual([])
    })
    it('should return only visible tokens, sorted by balances', () => {
      const result = getSortedPortfolioTokens(
        tokens,
        {
          ['ETH']: { usdValue: 1000, balance: 0.5 },
          [DAI.address]: { usdValue: 100, balance: 100 },
          [USDT.address]: { usdValue: 100, balance: 100 },
        },
        ChainId.MAINNET
      )

      expect(result).toEqual([nativeOnChain(ChainId.MAINNET), USDT, WBTC])
    })
  })
})

describe('tokenQuerySortComparator', () => {
  it('should return the input array if query is undefined', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator(''))
    expect(result).toEqual([DAI, USDC_MAINNET, USDT])
  })
  it('should return tokens that start with "us" first', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator('us'))
    expect(result).toEqual([USDC_MAINNET, USDT, DAI])
  })
  it('should return tokens that start with "us" first, regardless of case', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator('US'))
    expect(result).toEqual([USDC_MAINNET, USDT, DAI])
  })
  it('should return tokens that start with "da" first', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator('da'))
    expect(result).toEqual([DAI, USDC_MAINNET, USDT])
  })
  it('should return an exact match for DAI', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator('dai'))
    expect(result).toEqual([DAI, USDC_MAINNET, USDT])
  })
  it('should return an exact match for USDC and otherwise leave the order unchanged', () => {
    const result = [DAI, USDC_MAINNET, USDT].sort(tokenQuerySortComparator('usdc'))
    expect(result).toEqual([USDC_MAINNET, DAI, USDT])
  })
})

import { Token as InterfaceToken } from '@uniswap/sdk-core'
import { getSortedPortfolioTokens } from 'lib/hooks/useTokenList/sorting'
import { DAI, USDC_MAINNET, USDT, WBTC, nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Chain,
  Currency,
  Token,
  TokenBalance,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const nativeToken: Token = {
  id: 'native-token',
  chain: Chain.Ethereum,
  standard: TokenStandard.Native,
  decimals: 18,
  address: 'ETH',
  project: {
    id: '',
    tokens: [],
    isSpam: false,
  },
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
    token: { ...nonnativeToken(DAI), project: { id: '', tokens: [nonnativeToken(DAI)], isSpam: false } },
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
    token: {
      ...nonnativeToken(USDC_MAINNET),
      project: { id: '', tokens: [nonnativeToken(USDC_MAINNET)], isSpam: true },
    },
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
    token: { ...nonnativeToken(USDT), project: { id: '', tokens: [nonnativeToken(USDT)], isSpam: false } },
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
    token: { ...nonnativeToken(WBTC), project: { id: '', tokens: [nonnativeToken(WBTC)], isSpam: false } },
  },
]

describe('sorting', () => {
  describe('getSortedPortfolioTokens', () => {
    it('should return an empty array if portfolioTokenBalances is undefined', () => {
      const result = getSortedPortfolioTokens(undefined, {}, UniverseChainId.Mainnet, { isTestnetModeEnabled: false })
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
        UniverseChainId.Mainnet,
        { isTestnetModeEnabled: false },
      )

      expect(result).toEqual([nativeOnChain(UniverseChainId.Mainnet), USDT, WBTC])
    })
  })
})

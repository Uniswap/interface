import {
  Chain,
  Currency,
  Token,
  TokenBalance,
  TokenStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { splitHiddenTokens } from 'utils/splitHiddenTokens'

const nativeToken: Token = {
  id: 'native-token',
  chain: Chain.Ethereum,
  standard: TokenStandard.Native,
  project: {
    id: '',
    tokens: [],
    isSpam: false,
  },
}

const nonnativeToken: Token = {
  id: 'nonnative-token',
  chain: Chain.Ethereum,
  standard: TokenStandard.Erc20,
}

const tokens: TokenBalance[] = [
  // low balance
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
  {
    id: 'low-balance-nonnative',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      currency: Currency.Usd,
      value: 0.01,
    },
    token: {
      ...nonnativeToken,
      project: {
        id: '',
        tokens: [nonnativeToken],
        isSpam: false,
      },
    },
  },
  // spam
  {
    id: 'spam',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      value: 100,
    },
    token: {
      ...nonnativeToken,
      project: {
        id: '',
        tokens: [nonnativeToken],
        isSpam: true,
      },
    },
  },
  // valid
  {
    id: 'valid',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      value: 100,
    },
    token: {
      ...nonnativeToken,
      project: {
        id: '',
        tokens: [nonnativeToken],
        isSpam: false,
      },
    },
  },
  // empty value
  {
    id: 'undefined-value',
    ownerAddress: '',
    __typename: 'TokenBalance',
    denominatedValue: {
      id: '',
      // @ts-ignore this is evidently possible but not represented in our types
      value: undefined,
    },
    token: {
      ...nonnativeToken,
      project: {
        id: '',
        tokens: [nonnativeToken],
        isSpam: false,
      },
    },
  },
]

describe('splitHiddenTokens', () => {
  it('splits spam tokens into hidden but keeps small balances if hideSmallBalances = false', () => {
    const { visibleTokens, hiddenTokens } = splitHiddenTokens(tokens, { hideSmallBalances: false })

    expect(hiddenTokens.length).toBe(1)
    expect(hiddenTokens[0].id).toBe('spam')

    expect(visibleTokens.length).toBe(4)
    expect(visibleTokens[0].id).toBe('low-balance-native')
    expect(visibleTokens[1].id).toBe('low-balance-nonnative')
    expect(visibleTokens[2].id).toBe('valid')
    expect(visibleTokens[3].id).toBe('undefined-value')
  })

  it('splits small balance tokens into hidden but keeps small balances if hideSpam = false', () => {
    const { visibleTokens, hiddenTokens } = splitHiddenTokens(tokens, { hideSpam: false })

    expect(hiddenTokens.length).toBe(1)
    expect(hiddenTokens[0].id).toBe('low-balance-nonnative')

    expect(visibleTokens.length).toBe(4)
    expect(visibleTokens[0].id).toBe('low-balance-native')
    expect(visibleTokens[1].id).toBe('spam')
    expect(visibleTokens[2].id).toBe('valid')
    expect(visibleTokens[3].id).toBe('undefined-value')
  })

  it('splits non-native low balance into hidden by default', () => {
    const { visibleTokens, hiddenTokens } = splitHiddenTokens(tokens)

    expect(hiddenTokens.length).toBe(2)
    expect(hiddenTokens[0].id).toBe('low-balance-nonnative')
    expect(hiddenTokens[1].id).toBe('spam')

    expect(visibleTokens.length).toBe(3)
    expect(visibleTokens[0].id).toBe('low-balance-native')
    expect(visibleTokens[1].id).toBe('valid')
    expect(visibleTokens[2].id).toBe('undefined-value')
  })

  it('splits undefined value tokens into visible', () => {
    const { visibleTokens } = splitHiddenTokens(tokens)

    expect(visibleTokens.length).toBe(3)
    expect(visibleTokens[0].id).toBe('low-balance-native')
    expect(visibleTokens[1].id).toBe('valid')
    expect(visibleTokens[2].id).toBe('undefined-value')
  })
})

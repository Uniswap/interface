import { Currency, TokenBalance } from 'graphql/data/__generated__/types-and-hooks'

import { splitHiddenTokens } from './splitHiddenTokens'

const tokens: TokenBalance[] = [
  // low balance
  {
    id: 'low-balance',
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
        tokens: [],
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
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [],
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
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [],
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
    tokenProjectMarket: {
      id: '',
      currency: Currency.Eth,
      tokenProject: {
        id: '',
        tokens: [],
        isSpam: false,
      },
    },
  },
]

describe('splitHiddenTokens', () => {
  it('splits spam tokens into hidden but keeps small balances if hideSmallBalances = false', () => {
    const { visibleTokens, hiddenTokens } = splitHiddenTokens(tokens, {
      hideSmallBalances: false,
    })

    expect(hiddenTokens.length).toBe(1)
    expect(hiddenTokens[0].id).toBe('spam')

    expect(visibleTokens.length).toBe(3)
    expect(visibleTokens[0].id).toBe('low-balance')
    expect(visibleTokens[1].id).toBe('valid')
  })

  it('splits low balance into hidden by default', () => {
    const { visibleTokens, hiddenTokens } = splitHiddenTokens(tokens)

    expect(hiddenTokens.length).toBe(2)
    expect(hiddenTokens[0].id).toBe('low-balance')
    expect(hiddenTokens[1].id).toBe('spam')

    expect(visibleTokens.length).toBe(2)
    expect(visibleTokens[0].id).toBe('valid')
  })

  it('splits undefined value tokens into visible', () => {
    const { visibleTokens } = splitHiddenTokens(tokens)

    expect(visibleTokens.length).toBe(2)
    expect(visibleTokens[0].id).toBe('valid')
    expect(visibleTokens[1].id).toBe('undefined-value')
  })
})

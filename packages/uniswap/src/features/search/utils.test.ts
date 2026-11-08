import { getExplicitEnsTokenSearchName } from 'uniswap/src/features/search/utils'

describe('getExplicitEnsTokenSearchName', () => {
  it.each(['token.eth', 'token.example.eth', ' TOKEN.ETH '])('accepts explicit ENS names: %s', (name) => {
    expect(getExplicitEnsTokenSearchName(name)).toBe(name.trim())
  })

  it.each([null, '', 'weth', 'eth', '.eth', 'token..eth', 'token.eth.evil', 'token.com', 'https://token.eth', 'a b.eth'])(
    'leaves non-ENS token searches unchanged: %s',
    (query) => {
      expect(getExplicitEnsTokenSearchName(query)).toBeNull()
    },
  )
})

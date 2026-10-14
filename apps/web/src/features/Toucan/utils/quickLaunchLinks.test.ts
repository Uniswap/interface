import { UniverseChainId } from '@universe/chains'
import { getPoolsTokenPageUrl } from '~/features/Toucan/utils/quickLaunchLinks'

const TOKEN_ADDRESS = '0x1111111111111111111111111111111111111111'

describe('getPoolsTokenPageUrl', () => {
  it.each([
    [UniverseChainId.Robinhood, 'robinhood'],
    [UniverseChainId.Arc, 'arc'],
  ])('links to the token on supported chain %s', (chainId, slug) => {
    expect(getPoolsTokenPageUrl({ chainId, tokenAddress: TOKEN_ADDRESS })).toBe(
      `https://pools.xyz/t/${slug}/${TOKEN_ADDRESS}`,
    )
  })

  it.each([undefined, UniverseChainId.Mainnet, UniverseChainId.Sepolia, 999999])(
    'omits the link for unsupported chain %s',
    (chainId) => {
      expect(getPoolsTokenPageUrl({ chainId, tokenAddress: TOKEN_ADDRESS })).toBeUndefined()
    },
  )

  it.each([undefined, ''])('omits the link without a token address (%s)', (tokenAddress) => {
    expect(getPoolsTokenPageUrl({ chainId: UniverseChainId.Robinhood, tokenAddress })).toBeUndefined()
  })

  it('encodes the token address as one path segment', () => {
    expect(getPoolsTokenPageUrl({ chainId: UniverseChainId.Robinhood, tokenAddress: '0xabc/../?x=1' })).toBe(
      'https://pools.xyz/t/robinhood/0xabc%2F..%2F%3Fx%3D1',
    )
  })
})

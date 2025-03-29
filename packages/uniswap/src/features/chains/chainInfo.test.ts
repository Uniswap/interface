import { getQuicknodeChainId, getQuicknodeChainIdPathSuffix } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

jest.mock('uniswap/src/config', () => ({
  config: {
    quicknodeEndpointName: 'test-endpoint',
    quicknodeEndpointToken: 'test-token-123',
  },
}))

describe('getQuicknodeChainIdPathSuffix', () => {
  const testCases: Array<[UniverseChainId, string, string]> = [[UniverseChainId.Mainnet, '', 'Mainnet chain']]

  it.each(testCases)('returns correct path suffix for %s', (chainId, expectedSuffix, _testName) => {
    expect(getQuicknodeChainIdPathSuffix(chainId)).toBe(expectedSuffix)
  })
})

describe('getQuicknodeChainId', () => {
  it('throws error for unsupported chain', () => {
    // @ts-expect-error testing invalid chain id
    expect(() => getQuicknodeChainId(999999)).toThrow('Chain 999999 does not have a corresponding QuickNode chain ID')
  })
})

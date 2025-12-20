import { config } from 'uniswap/src/config'
import {
  getQuicknodeChainId,
  getQuicknodeChainIdPathSuffix,
  getQuicknodeEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

jest.mock('uniswap/src/config', () => ({
  config: {
    quicknodeEndpointName: 'test-endpoint',
    quicknodeEndpointToken: 'test-token-123',
  },
}))

describe('getQuicknodeChainIdPathSuffix', () => {
  const testCases: Array<[UniverseChainId, string, string]> = [
    [UniverseChainId.Avalanche, '/ext/bc/C/rpc', 'Avalanche chain'],
    [UniverseChainId.Mainnet, '', 'Mainnet chain'],
    [UniverseChainId.ArbitrumOne, '', 'Arbitrum chain'],
    [UniverseChainId.Base, '', 'Base chain'],
    [UniverseChainId.Blast, '', 'Blast chain'],
    [UniverseChainId.Bnb, '', 'BNB chain'],
    [UniverseChainId.Celo, '', 'Celo chain'],
    [UniverseChainId.Monad, '', 'Monad'],
    [UniverseChainId.Optimism, '', 'Optimism chain'],
    [UniverseChainId.Polygon, '', 'Polygon chain'],
    [UniverseChainId.Sepolia, '', 'Sepolia testnet'],
    [UniverseChainId.UnichainSepolia, '', 'Unichain Sepolia testnet'],
    [UniverseChainId.WorldChain, '', 'World chain'],
    [UniverseChainId.Zksync, '', 'ZkSync chain'],
    [UniverseChainId.Zora, '', 'Zora chain'],
  ]

  // eslint-disable-next-line max-params
  it.each(testCases)('returns correct path suffix for %s', (chainId, expectedSuffix, _testName) => {
    expect(getQuicknodeChainIdPathSuffix(chainId)).toBe(expectedSuffix)
  })
})

describe('getQuicknodeEndpointUrl', () => {
  it('constructs URL with different config values', () => {
    // Override config mock for this test
    jest.mocked(config).quicknodeEndpointName = 'different-endpoint'
    jest.mocked(config).quicknodeEndpointToken = 'different-token'

    const url = getQuicknodeEndpointUrl(UniverseChainId.Base)
    expect(url).toBe('https://different-endpoint.base-mainnet.quiknode.pro/different-token')

    // Reset mock to original values
    jest.mocked(config).quicknodeEndpointName = 'test-endpoint'
    jest.mocked(config).quicknodeEndpointToken = 'test-token-123'
  })

  it('throws error for unsupported chain', () => {
    // @ts-expect-error testing invalid chain id
    expect(() => getQuicknodeEndpointUrl(999999)).toThrow(
      'Chain 999999 does not have a corresponding QuickNode chain ID',
    )
  })

  it('handles all supported chains without throwing', () => {
    const supportedChains = [
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Avalanche,
      UniverseChainId.Base,
      UniverseChainId.Blast,
      UniverseChainId.Bnb,
      UniverseChainId.Celo,
      UniverseChainId.Monad,
      UniverseChainId.Optimism,
      UniverseChainId.Polygon,
      UniverseChainId.Sepolia,
      UniverseChainId.UnichainSepolia,
      UniverseChainId.WorldChain,
      UniverseChainId.Zksync,
      UniverseChainId.Zora,
      UniverseChainId.Mainnet,
    ]

    supportedChains.forEach((chainId) => {
      const url = getQuicknodeEndpointUrl(chainId)

      expect(url).toEqual(
        `https://test-endpoint${chainId === UniverseChainId.Mainnet ? '' : `.${getQuicknodeChainId(chainId)}`}.quiknode.pro/test-token-123${getQuicknodeChainIdPathSuffix(chainId)}`,
      )
    })
  })
})

describe('getQuicknodeChainId', () => {
  it('returns correct quicknode subdomain for each chain', () => {
    expect(getQuicknodeChainId(UniverseChainId.Mainnet)).toBe('')
    expect(getQuicknodeChainId(UniverseChainId.ArbitrumOne)).toBe('arbitrum-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Avalanche)).toBe('avalanche-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Base)).toBe('base-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Blast)).toBe('blast-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Bnb)).toBe('bsc')
    expect(getQuicknodeChainId(UniverseChainId.Celo)).toBe('celo-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Monad)).toBe('monad-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Optimism)).toBe('optimism')
    expect(getQuicknodeChainId(UniverseChainId.Polygon)).toBe('matic')
    expect(getQuicknodeChainId(UniverseChainId.Sepolia)).toBe('ethereum-sepolia')
    expect(getQuicknodeChainId(UniverseChainId.UnichainSepolia)).toBe('unichain-sepolia')
    expect(getQuicknodeChainId(UniverseChainId.WorldChain)).toBe('worldchain-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Zksync)).toBe('zksync-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Zora)).toBe('zora-mainnet')
  })

  it('throws error for unsupported chain', () => {
    // @ts-expect-error testing invalid chain id
    expect(() => getQuicknodeChainId(999999)).toThrow('Chain 999999 does not have a corresponding QuickNode chain ID')
  })
})

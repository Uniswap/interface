import { config } from 'uniswap/src/config'
import {
  getQuicknodeChainId,
  getQuicknodeChainIdPathSuffix,
  getQuicknodeEndpointUrl,
  getUniRpcEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

vi.mock('uniswap/src/config', () => ({
  config: {
    quicknodeEndpointName: 'test-endpoint',
    quicknodeEndpointToken: 'test-token-123',
    quicknodeSolanaRpcUrl: 'https://configured.solana-mainnet.quiknode.pro/configured-token/',
  },
}))

vi.mock('@universe/api', () => ({
  getEntryGatewayUrl: () => 'https://gateway.example',
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
    [UniverseChainId.Linea, '', 'Linea chain'],
    [UniverseChainId.Monad, '', 'Monad'],
    [UniverseChainId.Optimism, '', 'Optimism chain'],
    [UniverseChainId.Polygon, '', 'Polygon chain'],
    [UniverseChainId.Sepolia, '', 'Sepolia testnet'],
    [UniverseChainId.UnichainSepolia, '', 'Unichain Sepolia testnet'],
    [UniverseChainId.WorldChain, '', 'World chain'],
    [UniverseChainId.XLayer, '', 'XLayer chain'],
    [UniverseChainId.Zksync, '', 'ZkSync chain'],
    [UniverseChainId.Zora, '', 'Zora chain'],
  ]

  it.each(testCases)('returns correct path suffix for %s', (chainId, expectedSuffix, _testName) => {
    expect(getQuicknodeChainIdPathSuffix(chainId)).toBe(expectedSuffix)
  })
})

describe('getQuicknodeEndpointUrl', () => {
  it('constructs URL with different config values', () => {
    // Override config mock for this test
    vi.mocked(config).quicknodeEndpointName = 'different-endpoint'
    vi.mocked(config).quicknodeEndpointToken = 'different-token'

    const url = getQuicknodeEndpointUrl(UniverseChainId.Base)
    expect(url).toBe('https://different-endpoint.base-mainnet.quiknode.pro/different-token')

    // Reset mock to original values
    vi.mocked(config).quicknodeEndpointName = 'test-endpoint'
    vi.mocked(config).quicknodeEndpointToken = 'test-token-123'
  })

  it('throws error for unsupported chain', () => {
    // @ts-expect-error testing invalid chain id
    expect(() => getQuicknodeEndpointUrl(999999)).toThrow(
      'Chain 999999 does not have a corresponding QuickNode chain ID',
    )
  })

  it('returns the env-configured dedicated endpoint for chains not covered by the multichain endpoint', () => {
    expect(getQuicknodeEndpointUrl(UniverseChainId.Solana)).toBe(
      'https://configured.solana-mainnet.quiknode.pro/configured-token/',
    )
  })

  it('falls back to the multichain endpoint when no dedicated Solana URL is configured', () => {
    vi.mocked(config).quicknodeSolanaRpcUrl = ''

    expect(getQuicknodeEndpointUrl(UniverseChainId.Solana)).toBe(
      'https://test-endpoint.solana-mainnet.quiknode.pro/test-token-123',
    )

    vi.mocked(config).quicknodeSolanaRpcUrl = 'https://configured.solana-mainnet.quiknode.pro/configured-token/'
  })

  it('ignores a non-URL Solana config value (e.g. a leftover placeholder) and uses the multichain endpoint', () => {
    // A non-URL placeholder value must not become the RPC URL (Solana's Connection
    // throws on a non-http endpoint).
    vi.mocked(config).quicknodeSolanaRpcUrl = 'stored-in-.env.local'

    expect(getQuicknodeEndpointUrl(UniverseChainId.Solana)).toBe(
      'https://test-endpoint.solana-mainnet.quiknode.pro/test-token-123',
    )

    vi.mocked(config).quicknodeSolanaRpcUrl = 'https://configured.solana-mainnet.quiknode.pro/configured-token/'
  })

  it('handles all supported chains without throwing', () => {
    const supportedChains = [
      UniverseChainId.ArbitrumOne,
      UniverseChainId.Avalanche,
      UniverseChainId.Base,
      UniverseChainId.Blast,
      UniverseChainId.Bnb,
      UniverseChainId.Celo,
      UniverseChainId.Linea,
      UniverseChainId.Monad,
      UniverseChainId.XLayer,
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

describe('getUniRpcEndpointUrl', () => {
  it('builds the UniRPC gateway url for a chain', () => {
    expect(getUniRpcEndpointUrl(UniverseChainId.Arc)).toBe(`https://gateway.example/rpc/${UniverseChainId.Arc}`)
    expect(getUniRpcEndpointUrl(UniverseChainId.Robinhood)).toBe(
      `https://gateway.example/rpc/${UniverseChainId.Robinhood}`,
    )
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
    expect(getQuicknodeChainId(UniverseChainId.Linea)).toBe('linea-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Monad)).toBe('monad-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Optimism)).toBe('optimism')
    expect(getQuicknodeChainId(UniverseChainId.Polygon)).toBe('matic')
    expect(getQuicknodeChainId(UniverseChainId.Sepolia)).toBe('ethereum-sepolia')
    expect(getQuicknodeChainId(UniverseChainId.UnichainSepolia)).toBe('unichain-sepolia')
    expect(getQuicknodeChainId(UniverseChainId.WorldChain)).toBe('worldchain-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Zksync)).toBe('zksync-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.Zora)).toBe('zora-mainnet')
    expect(getQuicknodeChainId(UniverseChainId.XLayer)).toBe('xlayer-mainnet')
  })

  it('throws error for unsupported chain', () => {
    // @ts-expect-error testing invalid chain id
    expect(() => getQuicknodeChainId(999999)).toThrow('Chain 999999 does not have a corresponding QuickNode chain ID')
  })
})

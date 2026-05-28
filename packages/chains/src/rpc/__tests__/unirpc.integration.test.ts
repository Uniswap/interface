import { createTestSessionContext } from '@universe/sessions/src/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createEthersProviderFactory } from '../createEthersProvider'
import type { CreateEthersProvider } from '../createEthersProvider'
import { createViemClientFactory } from '../createViemClient'
import type { CreateViemClient } from '../createViemClient'
import { createUniRpcConfigResolver } from '../getUniRpcConfig'
import { createRpcConfigResolver } from '../resolveRpcConfig'
import type { RpcConfigResolver } from '../resolveRpcConfig'
import { UniverseChainId, RPCType } from '../types'
import type { ViemChainInfo } from '../types'

const REQUEST_SOURCE = 'uniswap-extension'
const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

const TEST_CHAIN_INFO: Record<number, ViemChainInfo> = {
  [UniverseChainId.Mainnet]: {
    id: UniverseChainId.Mainnet,
    name: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://cloudflare-eth.com'] } },
  },
  [UniverseChainId.Base]: {
    id: UniverseChainId.Base,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
  },
  [UniverseChainId.ArbitrumOne]: {
    id: UniverseChainId.ArbitrumOne,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } },
  },
}

describe('UniRPC Integration', () => {
  let session: Awaited<ReturnType<typeof createTestSessionContext>>
  let resolveRpcConfig: RpcConfigResolver
  let createProvider: CreateEthersProvider
  let createClient: CreateViemClient

  beforeAll(async () => {
    session = await createTestSessionContext({ platform: 'extension' })

    resolveRpcConfig = createRpcConfigResolver({
      resolveUniRpcConfig: createUniRpcConfigResolver({
        getFeatureFlag: () => true,
        getEntryGatewayUrl: () => session.backendUrl,
        requestSource: REQUEST_SOURCE,
        getRequestHeaders: () => session.getSessionHeaders(),
      }),
      selectLegacyRpcUrl: () => null,
    })

    createProvider = createEthersProviderFactory({ resolveRpcConfig })

    createClient = createViemClientFactory({
      resolveRpcConfig,
      getChainInfo: (chainId) => TEST_CHAIN_INFO[chainId]!,
      areAddressesEqual: (a, b) => a.toLowerCase() === b.toLowerCase(),
    })
  }, 45_000)

  afterAll(async () => {
    await session.cleanup()
  })

  // Raw fetch to validate gateway routing — factory-level session auth tested in ethers/viem suites below
  describe('transport validation', () => {
    it('requests route through UniRPC entry gateway', { timeout: 30000, retry: 3 }, async () => {
      const config = resolveRpcConfig({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
      expect(config).toBeTruthy()

      const headers = { ...config!.headers, ...(await session.getSessionHeaders()), 'Content-Type': 'application/json' }
      const response = await fetch(config!.rpcUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
      })

      expect(response.ok).toBe(true)
      expect(config!.rpcUrl).toContain('entry-gateway')
      expect(config!.rpcUrl).toContain('/rpc/')

      // Entry gateway sets apigw-requestid — direct providers (QuickNode, Infura) don't
      expect(response.headers.get('apigw-requestid')).toBeTruthy()

      const body = (await response.json()) as { jsonrpc: string; id: number; result: string }
      expect(body.jsonrpc).toBe('2.0')
      expect(body.result).toBeTruthy()
    })
  })

  describe('ethers via createEthersProviderFactory', () => {
    it('getBalance on mainnet', { timeout: 30000, retry: 3 }, async () => {
      const provider = createProvider({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
      expect(provider).toBeTruthy()
      const balance = await provider!.getBalance(VITALIK_ADDRESS)
      expect(balance.gt(0)).toBe(true)
    })

    it('getNetwork returns correct chainId', { timeout: 30000, retry: 3 }, async () => {
      const provider = createProvider({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
      expect(provider).toBeTruthy()
      const network = await provider!.getNetwork()
      expect(network.chainId).toBe(UniverseChainId.Mainnet)
    })
  })

  describe('viem via createViemClientFactory', () => {
    it('getBalance on mainnet', { timeout: 30000, retry: 3 }, async () => {
      const client = createClient({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
      expect(client).toBeDefined()
      const balance = await client!.getBalance({ address: VITALIK_ADDRESS })
      expect(balance).toBeGreaterThan(0n)
    })

    it('getChainId returns correct chain', { timeout: 30000, retry: 3 }, async () => {
      const client = createClient({ chainId: UniverseChainId.Mainnet, rpcType: RPCType.Public })
      expect(client).toBeDefined()
      const chainId = await client!.getChainId()
      expect(chainId).toBe(UniverseChainId.Mainnet)
    })
  })

  describe('multi-chain', () => {
    const chains = [
      { chainId: UniverseChainId.Mainnet, name: 'Mainnet' },
      { chainId: UniverseChainId.Base, name: 'Base' },
      { chainId: UniverseChainId.ArbitrumOne, name: 'Arbitrum' },
    ]

    it.each(chains)('viem getBlockNumber on $name', { timeout: 30000, retry: 3 }, async ({ chainId }) => {
      const client = createClient({ chainId, rpcType: RPCType.Public })
      expect(client).toBeDefined()
      const blockNumber = await client!.getBlockNumber()
      expect(blockNumber).toBeGreaterThan(0n)
    })

    it.each(chains)('ethers getBlockNumber on $name', { timeout: 30000, retry: 3 }, async ({ chainId }) => {
      const provider = createProvider({ chainId, rpcType: RPCType.Public })
      expect(provider).toBeTruthy()
      const blockNumber = await provider!.getBlockNumber()
      expect(blockNumber).toBeGreaterThan(0)
    })
  })
})

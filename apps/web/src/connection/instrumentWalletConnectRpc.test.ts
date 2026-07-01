import type { RpcErrorContext, RpcObserver } from '@universe/chains'
import { getRpcObserver, setRpcObserver } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CreateConnectorFn } from 'wagmi'
import { instrumentWalletConnectRpc } from '~/connection/instrumentWalletConnectRpc'

type FakeProvider = {
  chainId?: number
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
}

function instantiate(provider: FakeProvider): { getProvider: () => Promise<FakeProvider> } {
  const connectorFn = instrumentWalletConnectRpc((() => ({
    getProvider: async () => provider,
  })) as unknown as CreateConnectorFn)
  const config = {} as unknown as Parameters<typeof connectorFn>[0]
  return connectorFn(config) as unknown as { getProvider: () => Promise<FakeProvider> }
}

describe('instrumentWalletConnectRpc', () => {
  let onError: ReturnType<typeof vi.fn>
  let originalObserver: RpcObserver

  beforeEach(() => {
    originalObserver = getRpcObserver()
    onError = vi.fn()
    setRpcObserver({ onRequest: vi.fn(), onResponse: vi.fn(), onError })
  })

  afterEach(() => {
    setRpcObserver(originalObserver)
  })

  it('reports read RPC failures with transport "wc" and the resolved default rpc url', async () => {
    const httpError = Object.assign(new Error('HTTP request failed. Status: 429'), { status: 429 })
    const provider = await instantiate({
      chainId: UniverseChainId.Mainnet,
      request: () => Promise.reject(httpError),
    }).getProvider()

    await expect(provider.request({ method: 'eth_call' })).rejects.toBe(httpError)

    expect(onError).toHaveBeenCalledTimes(1)
    const ctx = onError.mock.calls[0]?.[0] as RpcErrorContext
    expect(ctx.transport).toBe('wc')
    expect(ctx.method).toBe('eth_call')
    expect(ctx.chainId).toBe(UniverseChainId.Mainnet)
    expect(ctx.url).toBe(getChainInfo(UniverseChainId.Mainnet).rpcUrls.default.http[0])
    expect(ctx.httpStatus).toBe(429)
  })

  it('does not report wallet-routed (signing) method failures', async () => {
    const provider = await instantiate({
      chainId: UniverseChainId.Mainnet,
      request: () => Promise.reject(new Error('user rejected')),
    }).getProvider()

    await expect(provider.request({ method: 'eth_sendTransaction' })).rejects.toThrow('user rejected')
    await expect(provider.request({ method: 'wallet_switchEthereumChain' })).rejects.toThrow('user rejected')

    expect(onError).not.toHaveBeenCalled()
  })

  it('does not report successful requests', async () => {
    const provider = await instantiate({
      chainId: UniverseChainId.Mainnet,
      request: () => Promise.resolve('0x1'),
    }).getProvider()

    await expect(provider.request({ method: 'eth_call' })).resolves.toBe('0x1')
    expect(onError).not.toHaveBeenCalled()
  })

  it('patches the provider request only once across repeated getProvider calls', async () => {
    const connector = instantiate({ chainId: UniverseChainId.Mainnet, request: () => Promise.resolve('0x1') })
    const first = await connector.getProvider()
    const patchedRequest = first.request
    const second = await connector.getProvider()

    expect(second).toBe(first)
    expect(second.request).toBe(patchedRequest)
  })
})

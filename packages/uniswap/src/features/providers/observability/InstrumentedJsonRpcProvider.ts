import { Networkish, StaticJsonRpcProvider } from '@ethersproject/providers'
import { generateRequestId, type RpcObserver } from 'uniswap/src/features/providers/observability/rpcObserver'

export class InstrumentedJsonRpcProvider extends StaticJsonRpcProvider {
  private observer: RpcObserver
  private chainIdNum: number
  private rpcUrl: string

  constructor({
    url,
    chainIdOrNetwork,
    observer,
  }: {
    url: string | undefined
    chainIdOrNetwork: Networkish
    observer: RpcObserver
  }) {
    super(url, chainIdOrNetwork)
    this.observer = observer
    this.chainIdNum =
      typeof chainIdOrNetwork === 'number'
        ? chainIdOrNetwork
        : typeof chainIdOrNetwork === 'object' && 'chainId' in chainIdOrNetwork
          ? chainIdOrNetwork.chainId
          : 0
    this.rpcUrl = url ?? ''
  }

  async perform(method: string, params: Record<string, unknown>): Promise<unknown> {
    const requestId = generateRequestId()
    const ctx = {
      requestId,
      method,
      params,
      chainId: this.chainIdNum,
      url: this.rpcUrl,
      transport: 'ethers' as const,
    }

    this.observer.onRequest(ctx)
    const start = performance.now()

    try {
      const result: unknown = await super.perform(method, params)
      this.observer.onResponse({ ...ctx, durationMs: performance.now() - start })
      return result
    } catch (error) {
      this.observer.onError({ ...ctx, durationMs: performance.now() - start, error })
      throw error
    }
  }
}

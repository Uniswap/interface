import { Network } from '@ethersproject/networks'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { SupportedInterfaceChain } from 'constants/chains'

import AppStaticJsonRpcProvider from './StaticJsonRpcProvider'

function checkNetworks(networks: Array<Network>): Network | null {
  let result: Network | null = null

  for (let i = 0; i < networks.length; i++) {
    const network = networks[i]

    // Null! We do not know our network; bail.
    if (network == null) {
      throw new Error('unknown network')
    }

    if (result) {
      // Make sure the network matches the previous networks
      if (
        !(
          result.name === network.name &&
          result.chainId === network.chainId &&
          (result.ensAddress === network.ensAddress || (result.ensAddress == null && network.ensAddress == null))
        )
      ) {
        throw new Error('networks mismatch')
      }
    } else {
      result = network
    }
  }

  return result
}

interface ProviderPerformance {
  callCount: number
  latency: number
  failureCount: number
  lastEvaluated: number
}

interface FallbackProviderEvaluation {
  provider: JsonRpcProvider
  performance: ProviderPerformance
}

/**
 * This provider balances requests among multiple JSON-RPC endpoints.
 */
export default class AppRpcProvider extends AppStaticJsonRpcProvider {
  providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>
  readonly evaluationIntervalMs: number

  constructor(chainId: SupportedInterfaceChain, providers: JsonRpcProvider[], evaluationIntervalMs = 30000) {
    if (providers.length === 0) throw new Error('providers array empty')
    providers.forEach((provider, i) => {
      if (!Provider.isProvider(provider)) throw new Error(`invalid provider ${i}`)
    })
    checkNetworks(providers.map((p) => p.network))

    super(chainId, providers[0].connection.url)
    this.providerEvaluations = providers.map((provider) => ({
      provider,
      performance: {
        callCount: 0,
        latency: 1,
        failureCount: 0,
        lastEvaluated: 0,
      },
    }))

    this.evaluationIntervalMs = evaluationIntervalMs
  }

  /**
   * Perform a JSON-RPC request.
   * Throws an error if all providers fail to perform the operation.
   */
  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    // Periodically evaluate all providers
    const currentTime = Date.now()
    // Note that this async action will not affect the current perform call
    this.providerEvaluations.forEach((providerEval) => {
      if (currentTime - providerEval.performance.lastEvaluated >= this.evaluationIntervalMs) {
        this.evaluateProvider(providerEval)
      }
    })

    this.providerEvaluations = AppRpcProvider.sortProviders(this.providerEvaluations.slice())

    // Always broadcast "sendTransaction" to all backends
    if (method === 'sendTransaction') {
      const results: Array<string | Error> = await Promise.all(
        this.providerEvaluations.map(({ performance, provider }) => {
          performance.callCount++
          return provider.sendTransaction(params.signedTransaction).then(
            (result) => result.hash,
            (error) => error
          )
        })
      )

      // Any success is good enough
      for (let i = 0; i < results.length; i++) {
        if (typeof results[i] === 'string') return results[i]
      }

      // They were all an error; pick the first error
      throw results[0]
    } else {
      for (const { provider, performance } of this.providerEvaluations) {
        performance.callCount++
        try {
          return await provider.perform(method, params)
        } catch (error) {
          performance.failureCount++
          console.warn('rpc action failed', error)
        }
      }
      throw new Error('All providers failed to perform the operation.')
    }
  }

  /**
   * Evaluates the performance of a provider. Updates latency and failure count metrics.
   */
  async evaluateProvider(config: FallbackProviderEvaluation): Promise<void> {
    const startTime = Date.now()
    config.performance.callCount++
    try {
      await config.provider.getBlockNumber()
    } catch (error) {
      config.performance.failureCount++
    }
    const latency = Date.now() - startTime
    config.performance.latency += latency

    config.performance.lastEvaluated = Date.now()
  }

  static sortProviders(providerEvaluations: FallbackProviderEvaluation[]) {
    return providerEvaluations.sort((a, b) => {
      // Provider a calculations
      const aAverageLatency = a.performance.latency / (a.performance.callCount || 1)
      const aFailRate = (a.performance.failureCount || 0.01) / (a.performance.callCount || 1)

      // Provider b calculations
      const bAverageLatency = b.performance.latency / (b.performance.callCount || 1)
      const bFailRate = (b.performance.failureCount || 0.01) / (b.performance.callCount || 1)

      if (aFailRate < bFailRate) return -1
      if (aAverageLatency < bAverageLatency) return -1
      return 1
    })
  }
}

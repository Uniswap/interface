import { Network } from '@ethersproject/networks'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'
import { SupportedInterfaceChain } from 'constants/chains'
import CachingJsonRpcProvider from 'rpc/CachingJsonRpcProvider'

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
}

interface ProviderPerformanceMetrics {
  latencyAvg: number
  failureRate: number
}

interface FallbackProviderEvaluation {
  provider: JsonRpcProvider
  performance: ProviderPerformance
}

function computeProviderPerformanceMetrics(performance: ProviderPerformance): ProviderPerformanceMetrics {
  if (performance.callCount === 0) {
    // guard against division by zero
    return { latencyAvg: 1, failureRate: 0.01 }
  } else {
    return {
      latencyAvg: performance.latency / performance.callCount,
      failureRate: performance.failureCount / performance.callCount,
    }
  }
}

/**
 * This provider includes fallbacks among multiple JSON-RPC endpoints should requests start to fail.
 */
export default class AppJsonRpcProvider extends CachingJsonRpcProvider {
  providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>

  constructor(chainId: SupportedInterfaceChain, providers: JsonRpcProvider[]) {
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
      },
    }))
  }

  /**
   * Perform a JSON-RPC request.
   * Throws an error if all providers fail to perform the operation.
   */
  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    this.providerEvaluations = AppJsonRpcProvider.sortProviders(this.providerEvaluations.slice())

    for (const { provider, performance } of this.providerEvaluations) {
      performance.callCount++
      try {
        const start = Date.now()
        const result = await provider.perform(method, params)
        performance.latency += Date.now() - start
        return result
      } catch (error) {
        performance.failureCount++
        console.warn('rpc action failed', error)
      }
    }
    throw new Error('All providers failed to perform the operation.')
  }

  static sortProviders(providerEvaluations: FallbackProviderEvaluation[]) {
    return providerEvaluations.sort((a, b) => {
      const { latencyAvg: aLatencyAvg, failureRate: aFailureRate } = computeProviderPerformanceMetrics(a.performance)
      const { latencyAvg: bLatencyAvg, failureRate: bFailureRate } = computeProviderPerformanceMetrics(b.performance)
      if (aFailureRate < bFailureRate) return -1
      if (aLatencyAvg < bLatencyAvg) return -1
      return 1
    })
  }
}

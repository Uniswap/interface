import { Network } from '@ethersproject/networks'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'

function now() {
  return new Date().getTime()
}

function checkNetworks(networks: Array<Network>): Network | null {
  let result: Network | null = null

  for (let i = 0; i < networks.length; i++) {
    const network = networks[i]

    // Null! We do not know our network; bail.
    if (network == null) {
      return null
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
        return null
      }
    } else {
      result = network
    }
  }

  return result
}

interface ProviderPerformance {
  latency: number
  failureRate: number
  lastEvaluated: number
}

interface FallbackProviderEvaluation {
  provider: JsonRpcProvider
  performance: ProviderPerformance
}

/**
 * AppRpcProvider is an extension of the JsonRpcProvider class from the ethers.js library.
 * This provider balances requests among multiple JSON-RPC endpoints.
 */
export default class AppRpcProvider extends JsonRpcProvider {
  readonly providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>
  readonly evaluationInterval: number

  constructor(providers: JsonRpcProvider[], evaluationInterval = 30000) {
    if (providers.length === 0) throw new Error('providers array empty')
    providers.forEach((provider, i) => {
      if (!Provider.isProvider(provider)) throw new Error(`invalid provider ${i}`)
    })
    const agreedUponNetwork = checkNetworks(providers.map((p) => p.network))
    if (!agreedUponNetwork) throw new Error('networks mismatch')

    super(providers[0].connection)
    this.providerEvaluations = providers.map((provider) => {
      return Object.freeze({
        provider,
        performance: {
          latency: Number.MAX_SAFE_INTEGER,
          failureRate: 0,
          lastEvaluated: 0,
        },
      })
    })

    this.evaluationInterval = evaluationInterval
  }

  /**
   * Perform a JSON-RPC request.
   *
   * method - The JSON-RPC method name.
   * params - The parameters for the JSON-RPC method.
   * Returns a Promise that resolves with the result of the JSON-RPC method.
   * Throws an error if all providers fail to perform the operation.
   */
  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    // Periodically evaluate all providers
    const currentTime = now()
    this.providerEvaluations.forEach((providerEval) => {
      if (currentTime - providerEval.performance.lastEvaluated >= this.evaluationInterval) {
        this.evaluateProvider(providerEval)
      }
    })

    // Sort providers by performance score (latency and failure rate)
    const sortedEvaluations = AppRpcProvider.sortProviders(this.providerEvaluations.slice())

    // Always broadcast "sendTransaction" to all backends
    if (method === 'sendTransaction') {
      const results: Array<string | Error> = await Promise.all(
        sortedEvaluations.map(({ provider }) => {
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
      for (const { provider, performance } of sortedEvaluations) {
        try {
          return provider.perform(method, params)
        } catch (error) {
          performance.failureRate++ // Increment failure rate
        }
      }
      throw new Error('All providers failed to perform the operation.')
    }
  }

  /**
   * Evaluates the performance of a provider. Updates latency and failure rate metrics.
   *
   * config - The provider evaluation configuration.
   * Returns a Promise that resolves when the evaluation is complete.
   */
  async evaluateProvider(config: FallbackProviderEvaluation): Promise<void> {
    const startTime = now()
    try {
      await config.provider.getBlockNumber()
      const latency = now() - startTime
      config.performance.latency = latency
      config.performance.failureRate = 0 // Reset failure rate on successful request
    } catch (error) {
      config.performance.failureRate += 1 // Increase failure rate on failed request
    }
    config.performance.lastEvaluated = now()
  }

  static sortProviders(providerEvaluations: FallbackProviderEvaluation[]) {
    return providerEvaluations.sort((a, b) => {
      const scoreA = a.performance.latency * (a.performance.failureRate + 1)
      const scoreB = b.performance.latency * (b.performance.failureRate + 1)
      return scoreA - scoreB
    })
  }
}

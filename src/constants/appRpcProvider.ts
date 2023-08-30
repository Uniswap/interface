import { Network } from '@ethersproject/networks'
import { defineReadOnly } from '@ethersproject/properties'
import { JsonRpcProvider, Provider } from '@ethersproject/providers'

function now() {
  return new Date().getTime()
}

function checkNetworks(networks: Array<Network>): Network | null {
  let result: Network | undefined = undefined

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

  return result ?? null
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

export default class AppRpcProvider extends JsonRpcProvider {
  readonly providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>
  readonly evaluationInterval: number
  _highestBlockNumber = -1
  primaryProvider: JsonRpcProvider

  constructor(providers: JsonRpcProvider[], evaluationInterval = 60000) {
    if (providers.length === 0) throw new Error('providers array empty')
    providers.forEach((provider, i) => {
      if (!Provider.isProvider(provider)) throw new Error(`invalid provider ${i}`)
    })
    const agreedUponNetwork = checkNetworks(providers.map((p) => p.network))
    if (!agreedUponNetwork) throw new Error('networks mismatch')

    const primaryProvider = providers[0]
    super(primaryProvider.connection)
    this.primaryProvider = primaryProvider
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
    defineReadOnly(this, 'providerEvaluations', Object.freeze(this.providerEvaluations))
  }

  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    // Sort providers by performance score (latency and failure rate)
    const sortedEvaluations = this.providerEvaluations.slice().sort((a, b) => {
      const scoreA = a.performance.latency * a.performance.failureRate
      const scoreB = b.performance.latency * b.performance.failureRate
      return scoreA - scoreB
    })

    this.primaryProvider = sortedEvaluations[0].provider

    // Periodically evaluate all providers
    const currentTime = now()
    this.providerEvaluations.forEach((providerEval) => {
      if (currentTime - providerEval.performance.lastEvaluated >= this.evaluationInterval) {
        this.evaluateProvider(providerEval)
      }
    })

    // Always broadcast "sendTransaction" to all backends
    if (method === 'sendTransaction') {
      const results: Array<string | Error> = await Promise.all(
        this.providerEvaluations.map((c) =>
          c.provider.sendTransaction(params.signedTransaction).then(
            (result) => result.hash,
            (error) => error
          )
        )
      )

      // Any success is good enough (other errors are likely "already seen" errors
      for (let i = 0; i < results.length; i++) {
        if (typeof results[i] === 'string') return results[i]
      }

      // They were all an error; pick the first error
      throw results[0]
    }

    return this.primaryProvider.perform(method, params)
  }

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
}

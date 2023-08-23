import { Provider } from '@ethersproject/abstract-provider'
import { Network } from '@ethersproject/networks'
import { defineReadOnly } from '@ethersproject/properties'
import { BaseProvider } from '@ethersproject/providers'

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
        console.warn('provider mismatch', 'networks', networks)
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
  provider: Provider
  performance: ProviderPerformance
}

export default class AppRpcProvider extends BaseProvider {
  readonly providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>
  readonly evaluationInterval: number
  _highestBlockNumber = -1
  primaryProvider: Provider

  private _blockCache = new Map<string, Promise<any>>()
  get blockCache() {
    // If the blockCache has not yet been initialized this block, do so by
    // setting a listener to clear it on the next block.
    if (!this._blockCache.size) {
      this.once('block', () => this._blockCache.clear())
    }
    return this._blockCache
  }
  constructor(providers: BaseProvider[], evaluationInterval = 60000) {
    if (providers.length === 0) throw new Error('providers array empty')
    const agreedUponNetwork = checkNetworks(providers.map((p) => p.network))
    if (!agreedUponNetwork) throw new Error('networks mismatch')
    providers.forEach((provider, i) => {
      if (!Provider.isProvider(provider)) throw new Error(`invalid provider ${i}`)
    })

    super(agreedUponNetwork)
    this.primaryProvider = providers[0]
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

    // We need to make sure we are in sync with our backends, so we need
    // @ts-expect-error
    if (!this.primaryProvider[method]) {
      throw new Error('method not supported')
    }

    // @ts-expect-error
    return this.primaryProvider[method](params)
  }

  private async evaluateProvider(config: FallbackProviderEvaluation): Promise<void> {
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

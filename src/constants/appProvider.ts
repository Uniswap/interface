import { Provider } from '@ethersproject/abstract-provider'
import { Network } from '@ethersproject/networks'
import { deepCopy, defineReadOnly } from '@ethersproject/properties'
import { BaseProvider, StaticJsonRpcProvider } from '@ethersproject/providers'
import { isPlain } from '@reduxjs/toolkit'

import { AVERAGE_L1_BLOCK_TIME } from './chainInfo'
import { CHAIN_IDS_TO_NAMES } from './chains'
import { RPC_URLS } from './networks'

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

export default class AppJsonRpcProvider extends StaticJsonRpcProvider {
  readonly providerEvaluations: ReadonlyArray<FallbackProviderEvaluation>
  readonly evaluationInterval: number
  _highestBlockNumber: number

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
    if (providers.length === 0) {
      console.warn('missing providers', 'providers', providers)
      throw new Error('providers array empty')
    }

    providers.forEach((provider) => {
      if (!Provider.isProvider(provider)) {
        console.warn('invalid provider', 'providers', providers)
        throw new Error('invalid provider')
      }
    })

    const providerEvaluations = providers.map((provider) => {
      return Object.freeze({
        provider,
        performance: {
          latency: Number.MAX_SAFE_INTEGER,
          failureRate: 0,
          lastEvaluated: 0,
        },
      })
    })
    const agreedUponNetwork = checkNetworks(providers.map((p) => p.network))
    if (!agreedUponNetwork) {
      console.error('invalid provider', 'providers', providers)
      throw new Error('networks mismatch')
    }

    super(agreedUponNetwork)
    // Including networkish allows ethers to skip the initial detectNetwork call.
    super(RPC_URLS[chainId][0], /* networkish= */ { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })
    this.evaluationInterval = evaluationInterval
    defineReadOnly(this, 'providerEvaluations', Object.freeze(providerEvaluations))

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers (eg AppJsonRpcProvider) need to update less frequently to be considered responsive.
    this.pollingInterval = AVERAGE_L1_BLOCK_TIME
  }

  async perform(method: string, params: { [name: string]: any }): Promise<any> {
    // Sort providers by performance score (latency and failure rate)
    const sortedEvaluations = this.providerEvaluations.slice().sort((a, b) => {
      const scoreA = a.performance.latency * a.performance.failureRate
      const scoreB = b.performance.latency * b.performance.failureRate
      return scoreA - scoreB
    })

    const primaryProvider = sortedEvaluations[0].provider

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
    // to know this before we can make a lot of calls
    if (this._highestBlockNumber === -1 && method !== 'getBlockNumber') {
      await this.getBlockNumber()
    }

    return primaryProvider[method](params)
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

  send(method: string, params: Array<any>): Promise<any> {
    // Only cache eth_call's.
    if (method !== 'eth_call') return super.send(method, params)

    // Only cache if params are serializable.
    if (!isPlain(params)) return super.send(method, params)

    const key = `call:${JSON.stringify(params)}`
    const cached = this.blockCache.get(key)
    if (cached) {
      this.emit('debug', {
        action: 'request',
        request: deepCopy({ method, params, id: 'cache' }),
        provider: this,
      })
      return cached
    }

    const result = super.send(method, params)
    this.blockCache.set(key, result)
    return result
  }
}

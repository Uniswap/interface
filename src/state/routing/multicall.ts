import { BigNumber } from '@ethersproject/bignumber'
import { BaseProvider } from '@ethersproject/providers'
import {
  CallSameFunctionOnContractWithMultipleParams,
  CallSameFunctionOnMultipleContractsParams,
  ChainId,
  Result,
  UniswapMulticallConfig,
  UniswapMulticallProvider,
} from '@uniswap/smart-order-router'
import { getBlocksPerFetchForChainId } from 'lib/state/multicall'

const stats = {
  params: { hits: 0, misses: 0 },
  contracts: { hits: 0, misses: 0 },
  total: { hits: 0, misses: 0 },
}

function record(cache: 'params' | 'contracts', hit: boolean) {
  if (hit) {
    stats[cache].hits += 1
    stats.total.hits += 1
  } else {
    stats[cache].misses += 1
    stats.total.misses += 1
  }
  console.table({
    params: {
      'hit percentage': `${Math.floor((stats.params.hits / (stats.params.hits + stats.params.misses)) * 100)}%`,
      'requests sent': `${stats.params.misses} / ${stats.params.hits + stats.params.misses}`,
    },
    contracts: {
      'hit percentage': `${Math.floor(
        (stats.contracts.hits / (stats.contracts.hits + stats.contracts.misses)) * 100
      )}%`,
      'requests sent': `${stats.contracts.misses} / ${stats.contracts.hits + stats.contracts.misses}`,
    },
    'total (multicall)': {
      'hit percentage': `${Math.floor((stats.total.hits / (stats.total.hits + stats.total.misses)) * 100)}%`,
      'requests sent': `${stats.total.misses} / ${stats.total.hits + stats.total.misses}`,
    },
  })
}

interface Entry {
  blockNumber: number
  // Results should only be fetched once per block per result,
  // so the pending result is stored as a Promise to avoid re-fetching.
  results: Map<string, Promise<Result<any>>>
}

interface BoundEntryCache {
  name: 'params' | 'contracts'
  get: () => Entry | undefined
  set: (entry: Entry) => void
  delete: () => void
}

/** A caching MulticallProvider to optimize smart-order routing. */
export class MulticallProvider extends UniswapMulticallProvider {
  private blocksPerFetch: number
  private multipleContractsResults = new Map<string, Entry>()
  private multipleParamsResults = new Map<string, Entry>()

  constructor(chainId: ChainId, provider: BaseProvider, gasLimitPerCall?: number) {
    super(chainId, provider, gasLimitPerCall)
    this.blocksPerFetch = getBlocksPerFetchForChainId(chainId)
  }

  getBlockNumber(entry?: { blockNumber: number }): number {
    const blockNumber = this.provider.blockNumber
    if (!entry) {
      return blockNumber
    } else if (blockNumber - entry.blockNumber >= this.blocksPerFetch) {
      return blockNumber
    } else {
      return entry.blockNumber
    }
  }

  async getCachedEntry<
    TParams extends { providerConfig?: { blockNumber?: number | Promise<number> } },
    TResult extends { results: Result<any>[] }
  >(params: TParams, fetch: (params: TParams) => Promise<TResult>, cache: BoundEntryCache, keys: string[]) {
    const entry = cache.get()
    const blockNumber = this.getBlockNumber(entry)
    const configBlockNumber = await params.providerConfig?.blockNumber
    if (configBlockNumber && blockNumber !== configBlockNumber) return fetch(params)

    if (blockNumber === entry?.blockNumber) {
      if (keys.every((key) => entry.results.has(key))) {
        record(cache.name, /*hit=*/ true)
        return {
          blockNumber: BigNumber.from(entry.blockNumber),
          results: (await Promise.all(keys.map((key) => entry.results.get(key)))) as Result<any>[],
        }
      } else if (keys.some((key) => entry.results.has(key))) {
        // NB: Dealing with partial hits may be a future optimization.
      }
    } else {
      cache.delete()
    }
    record(cache.name, /*hit=*/ false)

    const update = cache.get() || {
      blockNumber,
      results: new Map<string, Promise<Result<any>>>(),
    }
    const resolvers: ((value: Result<any>) => void)[] = []
    keys.forEach((key, i) => {
      if (update.results.has(key)) return

      update.results.set(
        key,
        new Promise((resolve) => {
          resolvers[i] = resolve
        })
      )
    })
    cache.set(update)

    const results = await fetch({ ...params, providerConfig: { blockNumber } })
    keys.forEach((key, i) => resolvers[i]?.(results.results[i]))
    return results
  }

  async callSameFunctionOnMultipleContracts<TFunctionParams extends any[] | undefined, TReturn>(
    params: CallSameFunctionOnMultipleContractsParams<TFunctionParams>
  ): Promise<{
    blockNumber: BigNumber
    results: Result<TReturn>[]
  }> {
    const { addresses, contractInterface, functionName, functionParams } = params
    const fragment = contractInterface.getFunction(functionName)
    const callData = contractInterface.encodeFunctionData(fragment, functionParams)
    const key = `${functionName}:${contractInterface.format('json')}:${callData}`
    return this.getCachedEntry(
      params,
      (params) => super.callSameFunctionOnMultipleContracts<TFunctionParams, TReturn>(params),
      {
        name: 'contracts',
        get: () => this.multipleContractsResults.get(key),
        set: (entry) => this.multipleContractsResults.set(key, entry),
        delete: () => this.multipleContractsResults.delete(key),
      },
      addresses
    )
  }

  async callSameFunctionOnContractWithMultipleParams<TFunctionParams extends any[] | undefined, TReturn>(
    params: CallSameFunctionOnContractWithMultipleParams<TFunctionParams, UniswapMulticallConfig>
  ) {
    const { address, contractInterface, functionName, functionParams, additionalConfig } = params
    const key = `${functionName}:${address}:${additionalConfig?.gasLimitPerCallOverride}}`
    const fragment = contractInterface.getFunction(functionName)
    const callData = functionParams.map((param) => contractInterface.encodeFunctionData(fragment, param))
    return {
      approxGasUsedPerSuccessCall: 0,
      ...(await this.getCachedEntry(
        params,
        (params) => super.callSameFunctionOnContractWithMultipleParams<TFunctionParams, TReturn>(params),
        {
          name: 'params',
          get: () => this.multipleParamsResults.get(key),
          set: (entry) => this.multipleParamsResults.set(key, entry),
          delete: () => this.multipleParamsResults.delete(key),
        },
        callData
      )),
    }
  }
}

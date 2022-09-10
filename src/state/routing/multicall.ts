import { BigNumber } from '@ethersproject/bignumber'
import { BaseProvider } from '@ethersproject/providers'
import {
  CallSameFunctionOnMultipleContractsParams,
  ChainId,
  Result,
  UniswapMulticallProvider,
} from '@uniswap/smart-order-router'
import { getBlocksPerFetchForChainId } from 'lib/state/multicall'

let hits = 0
let misses = 0

interface SameFunctionOnMultipleContractsEntry {
  blockNumber: number
  // Results should only be fetched once per block per address,
  // so the pending result is stored as a Promise to avoid re-fetching.
  addresses: Map<string, Promise<Result<any>>>
}

/** A caching MulticallProvider to optimize smart-order routing. */
export class MulticallProvider extends UniswapMulticallProvider {
  private blocksPerFetch: number
  private sameFunctionOnMultipleContractsResults = new Map<string, SameFunctionOnMultipleContractsEntry>()

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

  async callSameFunctionOnMultipleContracts<TFunctionParams extends any[] | undefined, TReturn = any>(
    params: CallSameFunctionOnMultipleContractsParams<TFunctionParams>
  ): Promise<{
    blockNumber: BigNumber
    results: Result<TReturn>[]
  }> {
    const { addresses, contractInterface, functionName, functionParams, providerConfig } = params
    if (functionParams) {
      console.log('MULTICALL:', 'skip(functionParams)')
      return super.callSameFunctionOnMultipleContracts(params)
    }

    const key = `${functionName}:${contractInterface.format('json')}`
    const entry = this.sameFunctionOnMultipleContractsResults.get(key)

    const blockNumber = this.getBlockNumber(entry)
    if (blockNumber !== entry?.blockNumber) this.sameFunctionOnMultipleContractsResults.delete(key)

    const configBlockNumber = await providerConfig?.blockNumber
    if (configBlockNumber && blockNumber !== configBlockNumber) {
      console.log('MULTICALL:', 'skip(blockNumber)')
      return super.callSameFunctionOnMultipleContracts(params)
    }

    if (entry && addresses.every((address) => entry.addresses.has(address))) {
      console.log('MULTICALL:', 'hit', ++hits / (hits + misses))
      return {
        blockNumber: BigNumber.from(entry.blockNumber),
        results: (await Promise.all(addresses.map((address) => entry.addresses.get(address)))) as Result<TReturn>[],
      }
    } else if (entry && addresses.some((address) => entry.addresses.has(address))) {
      // NB: Dealing with partial hits may be a future optimization.
    }
    console.log('MULTICALL:', 'miss', hits / (hits + ++misses))

    const update = this.sameFunctionOnMultipleContractsResults.get(key) || {
      blockNumber,
      addresses: new Map<string, Promise<any>>(),
    }
    const resolvers: ((value: any) => void)[] = []
    addresses.forEach((address, i) => {
      if (update.addresses.has(address)) return

      update.addresses.set(
        address,
        new Promise((resolve) => {
          resolvers[i] = resolve
        })
      )
    })
    this.sameFunctionOnMultipleContractsResults.set(key, update)

    const results = await super.callSameFunctionOnMultipleContracts({ ...params, providerConfig: { blockNumber } })
    addresses.forEach((address, i) => resolvers[i]?.(results.results[i]))
    return results
  }

  // TODO(zzmp): Add caching layer for the other used method?
}

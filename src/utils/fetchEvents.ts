import { BlockTag } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@ubeswap/sdk'
import { BaseContract, Event, EventFilter } from 'ethers'
import makeConcurrencyLimited from 'utils/concurrencyLimiter'
import pMemoize from 'utils/promiseMemoize'

import { EVENT_FETCH_RPC_URLS } from '../constants'

async function eventFetcher<T>(
  contract: BaseContract,
  filter: EventFilter,
  fromBlockOrBlockhash?: BlockTag | undefined,
  toBlock?: BlockTag | undefined
): Promise<T[]> {
  const chainId = (contract.provider as any)._network.chainId

  const promises = [contract.queryFilter(filter, fromBlockOrBlockhash, toBlock)]

  const alternativeRpc = EVENT_FETCH_RPC_URLS[chainId as ChainId]
  if (alternativeRpc) {
    const alternativeProvider = new JsonRpcProvider(alternativeRpc)
    promises.push(contract.connect(alternativeProvider).queryFilter(filter, fromBlockOrBlockhash, toBlock))
  }
  const result = await Promise.any<Event[]>(promises)
  return result as unknown as T[]
}

function generateCacheKey(
  arguments_: [
    contract: BaseContract,
    filter: EventFilter,
    fromBlockOrBlockhash?: BlockTag | undefined,
    toBlock?: BlockTag | undefined
  ]
): string {
  return arguments_[0].address + '-' + JSON.stringify(arguments_[1]) + '-' + arguments_[2] + '-' + arguments_[3]
}

const rateLimited = makeConcurrencyLimited(eventFetcher, 3)
const memoized = pMemoize(rateLimited, {
  cacheKey: generateCacheKey,
})

export default memoized

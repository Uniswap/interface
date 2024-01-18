import { BlockTag } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@ubeswap/sdk'
import { BaseContract, Event, EventFilter } from 'ethers'

import { EVENT_FETCH_RPC_URLS } from '../constants'

export default async function fetchEvents<T>(
  contract: BaseContract,
  filter: EventFilter,
  fromBlockOrBlockhash?: BlockTag | undefined,
  toBlock?: BlockTag | undefined
): Promise<T[]> {
  const chainId = (await contract.provider.getNetwork()).chainId

  const promises = [contract.queryFilter(filter, fromBlockOrBlockhash, toBlock)]

  const alternativeRpc = EVENT_FETCH_RPC_URLS[chainId as ChainId]
  if (alternativeRpc) {
    const alternativeProvider = new JsonRpcProvider(alternativeRpc)
    promises.push(contract.connect(alternativeProvider).queryFilter(filter, fromBlockOrBlockhash, toBlock))
  }

  const result = await Promise.any<Event[]>(promises)
  return result as unknown as T[]
}

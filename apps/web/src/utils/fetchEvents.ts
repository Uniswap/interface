import { BlockTag } from '@ethersproject/abstract-provider'
import { BaseContract, Event, EventFilter } from '@ethersproject/contracts'
import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers'
import { ChainId } from '@ubeswap/sdk-core'
import makeConcurrencyLimited from 'utils/concurrencyLimiter'
import pMemoize from 'utils/promiseMemoize'

const EVENT_FETCH_RPC_URLS = {
  [ChainId.CELO]: ['https://celo-mainnet.infura.io/v3/801f4c55ea6b48b4b629c9645964eaa9', 'https://rpc.ankr.com/celo'],
  [ChainId.CELO_ALFAJORES]: [''],
}

async function eventFetcher<T>(
  contract: BaseContract,
  filter: EventFilter,
  fromBlockOrBlockhash?: BlockTag | undefined,
  toBlock?: BlockTag | undefined
): Promise<T[]> {
  const provider = contract.provider as BaseProvider
  const network = await provider.getNetwork()
  const chainId = network.chainId

  const currentBlock = await provider.getBlockNumber()
  const startBlock = typeof fromBlockOrBlockhash == 'number' ? fromBlockOrBlockhash : 0
  const endBlock = toBlock == 'latest' ? currentBlock : typeof toBlock == 'number' ? toBlock : currentBlock
  console.log({ startBlock, endBlock })
  if (startBlock >= 0 && endBlock - startBlock > 10_000) {
    // block range too wide
    return []
  }

  const promises = [contract.queryFilter(filter, fromBlockOrBlockhash, toBlock)]

  const alternativeRpcs = EVENT_FETCH_RPC_URLS[chainId as ChainId.CELO | ChainId.CELO_ALFAJORES]
  if (alternativeRpcs.length > 0) {
    for (const rpcUrl of alternativeRpcs) {
      if (rpcUrl) {
        const alternativeProvider = new JsonRpcProvider(rpcUrl)
        promises.push(contract.connect(alternativeProvider).queryFilter(filter, fromBlockOrBlockhash, toBlock))
      }
    }
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

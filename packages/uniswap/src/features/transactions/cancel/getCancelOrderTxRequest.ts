import { BigNumber } from '@ethersproject/bignumber'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import {
  CosignedPriorityOrder,
  CosignedV2DutchOrder,
  CosignedV3DutchOrder,
  DutchOrder,
  getCancelSingleParams,
} from '@uniswap/uniswapx-sdk'
import { Contract, providers } from 'ethers/lib/ethers'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { getOrders } from 'uniswap/src/features/transactions/swap/orders'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

function getPermit2Contract(): Permit2 {
  return new Contract(PERMIT2_ADDRESS, PERMIT2_ABI) as Permit2
}

const ROUTING_TO_ORDER_CLASS = {
  [Routing.DUTCH_V2]: CosignedV2DutchOrder,
  [Routing.DUTCH_V3]: CosignedV3DutchOrder,
  [Routing.PRIORITY]: CosignedPriorityOrder,
  [Routing.DUTCH_LIMIT]: DutchOrder,
} as const

function getPermit2NonceForOrder({
  encodedOrder,
  chainId,
  routing,
}: {
  encodedOrder: string
  chainId: number
  routing: UniswapXOrderDetails['routing']
}): BigNumber {
  return ROUTING_TO_ORDER_CLASS[routing].parse(encodedOrder, chainId).info.nonce
}

export async function getCancelOrderTxRequest(tx: UniswapXOrderDetails): Promise<providers.TransactionRequest | null> {
  const { orderHash, chainId, from, routing } = tx
  if (!orderHash) {
    return null
  } else {
    const { encodedOrder } = (await getOrders([orderHash])).orders[0] ?? {}
    if (!encodedOrder) {
      return null
    }

    const nonce = getPermit2NonceForOrder({ encodedOrder, chainId, routing })
    const cancelParams = getCancelSingleParams(nonce)

    const permit2 = getPermit2Contract()
    const cancelTx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams.word, cancelParams.mask)
    return { ...cancelTx, from, chainId }
  }
}

import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { ChainId } from '@ubeswap/sdk'
import { BigNumber } from 'ethers'
import { OrderBook__factory } from 'generated'
import { useLimitOrderProtocolContract } from 'hooks/useContract'
import React, { useEffect } from 'react'
import { useSingleContractMultipleData } from 'state/multicall/hooks'

import { LIMIT_ORDER_ADDRESS, ORDER_BOOK_ADDRESS } from '../../constants'

// TODO: Just do batch fetching in the future
const CREATION_BLOCK = 10_000_000

export interface LimitOrdersHistory {
  orderHash: string
  isOrderOpen: boolean
  makingAmount: BigNumber
  takingAmount: BigNumber
  makerAsset: string
  takerAsset: string
  remaining: BigNumber
  transactionHash: string
}

export interface LimitOrderRewards {
  rewardRate: BigNumber
  makerCurrencyAddress: string
}

type OrderBookEvent = {
  maker: string
  orderHash: string
  order: {
    salt: BigNumber
    makerAsset: string
    takerAsset: string
    maker: string
    receiver: string
    allowedSender: string
    makingAmount: BigNumber
    takingAmount: BigNumber
    makerAssetData: string
    takerAssetData: string
    getMakerAmount: string
    getTakerAmount: string
    predicate: string
    permit: string
    interaction: string
  }
  signature: string
  transactionHash: string
}

export const useOrderBroadcasted = () => {
  const { account, network } = useContractKit()
  const provider = useProvider()
  const chainId = network.chainId as unknown as ChainId
  const orderBookAddr = ORDER_BOOK_ADDRESS[chainId]

  const [orderBroadcasts, setOrderBroadcasts] = React.useState<OrderBookEvent[]>([])
  const call = React.useCallback(async () => {
    if (!account) {
      return
    }
    const orderBook = OrderBook__factory.connect(orderBookAddr, provider)
    const orderBookEvents = await orderBook.queryFilter(
      orderBook.filters['OrderBroadcasted'](account),
      CREATION_BLOCK,
      'latest'
    )
    const orderBroadcasts = orderBookEvents.map((orderBookEvent) => {
      return {
        ...orderBookEvent.args,
        transactionHash: orderBookEvent.transactionHash,
      }
    })
    setOrderBroadcasts(orderBroadcasts)
  }, [account, orderBookAddr, provider])

  useEffect(() => {
    const timer = setInterval(call, 5000)
    return () => {
      clearInterval(timer)
    }
  }, [call])

  return orderBroadcasts
}

export const useLimitOrdersHistory = (): LimitOrdersHistory[] => {
  const orderEvents = useOrderBroadcasted()
  const { network } = useContractKit()
  const chainId = network.chainId as unknown as ChainId
  const limitOrderAddr = LIMIT_ORDER_ADDRESS[chainId]

  const limitOrderProtocol = useLimitOrderProtocolContract(limitOrderAddr)
  const remainingsRaw = useSingleContractMultipleData(
    limitOrderProtocol,
    'remainingRaw',
    orderEvents.map(({ orderHash }) => [orderHash])
  )
  const remainings = remainingsRaw?.find((result) => !result.result)
    ? null
    : (remainingsRaw.map((r) => r.result?.[0] ?? BigNumber.from(0)) as readonly BigNumber[])

  return React.useMemo(() => {
    if (!remainings) return []

    return orderEvents.map(({ orderHash, order, transactionHash }, idx) => {
      const { makerAsset, takerAsset, makingAmount, takingAmount } = order
      const remaining = remainings[idx].eq(0) ? makingAmount : remainings[idx].sub(1)

      return {
        orderHash,
        makerAsset,
        takerAsset,
        isOrderOpen: remaining.gt(0),
        remaining,
        makingAmount,
        takingAmount,
        transactionHash,
      }
    })
  }, [orderEvents, remainings])
}

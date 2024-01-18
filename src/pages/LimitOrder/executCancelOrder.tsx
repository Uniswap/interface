import { CancelLimitOrderExecutor } from 'components/swap/routing'
import { ContractTransaction } from 'ethers'
import { LimitOrderProtocol__factory, OrderBook__factory } from 'generated'
import { OrderBroadcastedEvent } from 'generated/OrderBook'
import fetchEvents from 'utils/fetchEvents'

import { LIMIT_ORDER_ADDRESS, ORDER_BOOK_ADDRESS } from '../../constants'

export const executeCancelOrder: CancelLimitOrderExecutor = async ({ signer, chainId, orderHash, doTransaction }) => {
  const orderBookAddr = ORDER_BOOK_ADDRESS[chainId]
  const limitOrderAddr = LIMIT_ORDER_ADDRESS[chainId]

  const orderBook = OrderBook__factory.connect(orderBookAddr, signer)
  const limitOrderProtocolFactory = LimitOrderProtocol__factory.connect(limitOrderAddr, signer)

  const cancel = async (): Promise<ContractTransaction> => {
    const filter = orderBook.filters['OrderBroadcasted'](undefined, orderHash)
    const orders = await fetchEvents<OrderBroadcastedEvent>(orderBook, filter)
    if (orders.length === 0) {
      throw new Error('Error finding the order')
    } else if (orders.length > 0) {
      console.warn('More than one order was found with the same hash')
    }

    const { order } = orders[0].args

    return await doTransaction(limitOrderProtocolFactory, 'cancelOrder', {
      args: [order],
      summary: `Cancel Order`,
    })
  }

  return { hash: (await cancel()).hash }
}

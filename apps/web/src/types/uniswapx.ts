import { TradingApi } from '@universe/api'
import { OffchainOrderType } from 'state/routing/types'

// Mirrors UniswapXOrderEntity type at https://github.com/Uniswap/uniswapx-service/blob/main/lib/entities/Order.ts
interface BaseUniswapXBackendOrder {
  type: OffchainOrderType
  encodedOrder: string
  signature: string
  nonce: string
  orderHash: string
  orderStatus: TradingApi.OrderStatus
  chainId: number
  swapper: string
  reactor: string
  decayStartTime: number
  decayEndTime: number
  deadline: number
  input: {
    token: string
    startAmount?: string
    endAmount?: string
  }
  outputs: [
    {
      recipient: string
      startAmount: string
      endAmount: string
      token: string
    },
  ]
  createdAt?: number
  // QuoteId field is defined when the order has a quote associated with it.
  quoteId?: string
  cosignerData?: {
    decayStartTime: number
    decayEndTime: number
    exclusiveFiller: string
    inputOverride: string
    outputOverrides: string[]
  }
  cosignature?: string
}

interface NonfilledUniswapXBackendOrder extends BaseUniswapXBackendOrder {
  orderStatus:
    | TradingApi.OrderStatus.OPEN
    | TradingApi.OrderStatus.EXPIRED
    | TradingApi.OrderStatus.ERROR
    | TradingApi.OrderStatus.CANCELLED
    | TradingApi.OrderStatus.INSUFFICIENT_FUNDS
}

interface FilledUniswapXBackendOrder extends BaseUniswapXBackendOrder {
  orderStatus: TradingApi.OrderStatus.FILLED
  // Filler field is defined when the order has been filled and the status tracking function has recorded the filler address.
  filler?: string
  // TxHash field is defined when the order has been filled and there is a txHash associated with the fill.
  txHash: string
  // SettledAmount field is defined for v1 orders when the order has been filled and the fill amounts have been recorded.
  settledAmounts?: [
    {
      tokenIn: string
      amountIn: string
      tokenOut: string
      amountOut: string
    },
  ]
}

export type UniswapXBackendOrder = FilledUniswapXBackendOrder | NonfilledUniswapXBackendOrder

export type OrderQueryResponse = {
  orders: UniswapXBackendOrder[]
}

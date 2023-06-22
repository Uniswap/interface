export enum UniswapXOrderStatus {
  FILLED = 'filled',
  OPEN = 'open',
  EXPIRED = 'expired',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  INSUFFICIENT_FUNDS = 'insufficient-funds',
}

interface UniswapXBackendOrderFields {
  orderStatus: UniswapXOrderStatus
  orderHash: string
  offerer: string
  createdAt: number
  chainId: number
  input: {
    endAmount: string
    token: string
    startAmount: string
  }
  outputs: [
    {
      recipient: string
      startAmount: string
      endAmount: string
      token: string
    }
  ]
}

interface NonfilledUniswapXBackendOrder extends UniswapXBackendOrderFields {
  orderStatus:
    | UniswapXOrderStatus.OPEN
    | UniswapXOrderStatus.EXPIRED
    | UniswapXOrderStatus.ERROR
    | UniswapXOrderStatus.CANCELLED
    | UniswapXOrderStatus.INSUFFICIENT_FUNDS
}

interface FilledUniswapXBackendOrder extends UniswapXBackendOrderFields {
  orderStatus: UniswapXOrderStatus.FILLED
  txHash: string
  settledAmounts: [
    {
      tokenOut: string
      amountOut: string
    }
  ]
}

export type UniswapXBackendOrder = FilledUniswapXBackendOrder | NonfilledUniswapXBackendOrder

export type OrderQueryResponse = {
  orders: UniswapXBackendOrder[]
}

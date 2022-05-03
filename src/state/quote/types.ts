import { Currency, Token } from '@uniswap/sdk-core'

export type OrderInQuote = {
  makerToken: string
  makerAmount: string
  takerToken: string
  takerAmount: string
}

export interface GetQuote0xResult {
  to: string
  data: string
  value: string
  gas: string
  estimatedGas: string

  buyTokenAddress: string
  buyAmount: string

  sellTokenAddress: string
  sellAmount: string

  allowanceTarget: string
  orders: OrderInQuote[]
}

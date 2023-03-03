import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'

export type Route = {
  pool: string

  tokenIn: string
  swapAmount: string

  tokenOut: string
  amountOut: string

  limitReturnAmount: string
  exchange: string
  poolLength: number
  poolType: string
  extra: string
}

export type FeeConfig = {
  feeAmount: string
  chargeFeeBy: string
  isInBps: boolean
  feeReceiver: string
}

export type DetailedRouteSummary = {
  tokenIn: string
  amountIn: string
  parsedAmountIn: CurrencyAmount<Currency>
  amountInUsd: string

  tokenOut: string
  amountOut: string
  parsedAmountOut: CurrencyAmount<Currency>
  amountOutUsd: string

  priceImpact: number
  executionPrice: Price<Currency, Currency>

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: FeeConfig
  route: Route[][]

  routerAddress: string
}

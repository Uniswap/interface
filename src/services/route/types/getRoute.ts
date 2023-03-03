export type GetRouteParams = {
  tokenIn: string
  tokenOut: string
  amountIn: string
  saveGas: string
  includedSources: string
  excludedSources?: string
  gasInclude: string
  gasPrice: string
  feeAmount: string
  chargeFeeBy: string
  isInBps: string
  feeReceiver: string
  debug?: string
}

type Route = {
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

type FeeConfig = {
  feeAmount: string
  chargeFeeBy: string
  isInBps: boolean
  feeReceiver: string
}

export type RouteSummary = {
  tokenIn: string
  amountIn: string
  amountInUsd: string

  tokenOut: string
  amountOut: string
  amountOutUsd: string
  tokenOutMarketPriceAvailable: null

  gas: string
  gasUsd: string
  gasPrice: string

  extraFee: FeeConfig
  route: Route[][]
}

export type GetRouteData = {
  routeSummary: RouteSummary | null
  routerAddress: string
  fromMeta: boolean
}

export type GetRouteResponse = {
  code: number
  message: string
  data?: GetRouteData
}

export enum V3TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

export interface GetQuoteResult {
  blockNumber: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  methodParameters: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  quoteId: string
  route: {
    address: string
    amountIn?: string
    amountOut?: string
    fee: string
    liquidity: string
    sqrtRatioX96: string
    tickCurrent: string
    tokenIn: {
      address: string
      chainId: number
      decimals: string | number
      symbol?: string
    }
    tokenOut: {
      address: string
      chainId: number
      decimals: string | number
      symbol?: string
    }
  }[][]
  routeString: string
}

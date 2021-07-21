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
  routeEdges: {
    fee: string
    id: string
    inId: string
    outId: string
    percent: number
    type: string
  }[]
  routeNodes: { chainId: number; id: string; symbol: string; type: string }[]
  routeString: string
}

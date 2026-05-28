import { type DiscriminatedQuoteResponse, type GasEstimate } from '@universe/api'

export function getGasEstimate(data: DiscriminatedQuoteResponse | null): GasEstimate | undefined {
  if (!data?.quote || !('gasEstimates' in data.quote) || !data.quote.gasEstimates) {
    return undefined
  }

  return data.quote.gasEstimates[0]
}

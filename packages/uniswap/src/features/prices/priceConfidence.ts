export const LOW_PRICE_CONFIDENCE_THRESHOLD = 0.01

export function isLowPriceConfidence(confidenceScore: number | undefined): boolean {
  return confidenceScore !== undefined && confidenceScore < LOW_PRICE_CONFIDENCE_THRESHOLD
}

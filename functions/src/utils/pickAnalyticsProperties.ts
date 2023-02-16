const pickAnalyticsProperties = (
  txResponse: Record<string, unknown>
): {
  baseCurrency: unknown
  baseCurrencyAmount: unknown
  country: unknown
  createdAt: unknown
  currency: unknown
  extraFeeAmount: unknown
  failureReason: unknown
  feeAmount: unknown
  id: unknown
  networkFeeAmount: unknown
  paymentMethod: unknown
  quoteCurrencyAmount: unknown
  status: unknown
  type: unknown
  updatedAt: unknown
  usdRate: unknown
} => {
  return {
    baseCurrency: txResponse.baseCurrency,
    baseCurrencyAmount: txResponse.baseCurrencyAmount,
    country: txResponse.country,
    createdAt: txResponse.createdAt,
    currency: txResponse.currency,
    extraFeeAmount: txResponse.extraFeeAmount,
    failureReason: txResponse.failureReason,
    feeAmount: txResponse.feeAmount,
    id: txResponse.id,
    networkFeeAmount: txResponse.networkFeeAmount,
    paymentMethod: txResponse.paymentMethod,
    quoteCurrencyAmount: txResponse.quoteCurrencyAmount,
    status: txResponse.status,
    type: txResponse.type,
    updatedAt: txResponse.updatedAt,
    usdRate: txResponse.usdRate,
  }
}

export default pickAnalyticsProperties

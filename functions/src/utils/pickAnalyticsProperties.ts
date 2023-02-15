const pickAnalyticsProperties = (txResponse: Record<string, unknown>) => {
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

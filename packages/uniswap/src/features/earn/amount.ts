export function getProjectedAnnualEarnings({ balance, apyPercent }: { balance: number; apyPercent: number }): number {
  return balance * (apyPercent / 100)
}

// `exactAmountToken` is computed from the on-chain quantity; `exactAmountFiat` from the indexer's USD
// balance. If the two sources drift (e.g. mid-rebalance), the resulting strings won't represent the
// same dollar amount at the current spot price. Acceptable for percent shortcuts — the user is asking
// to spend a percentage of "what their wallet says they have", and the swap itself executes against
// the canonical token quantity. Re-deriving fiat from `exactAmountToken * (balanceUsd / balanceQuantity)`
// would be mathematically equivalent and would not eliminate the drift.
export function getEarnPercentageInput({
  balanceQuantity,
  balanceUsd,
  convertUsdToLocalFiat,
  fiatDecimals = 2,
  percentage,
  tokenDecimals,
}: {
  balanceQuantity: number
  balanceUsd: number | undefined
  convertUsdToLocalFiat: (balanceUsd: number) => number
  fiatDecimals?: number
  percentage: number
  tokenDecimals: number
}): {
  exactAmountFiat: string
  exactAmountToken: string
  inputInFiat: boolean
} {
  const exactAmountToken = (balanceQuantity * percentage).toFixed(tokenDecimals)

  if (balanceUsd !== undefined && balanceUsd > 0) {
    return {
      exactAmountFiat: (convertUsdToLocalFiat(balanceUsd) * percentage).toFixed(fiatDecimals),
      exactAmountToken,
      inputInFiat: true,
    }
  }

  return {
    exactAmountFiat: '',
    exactAmountToken,
    inputInFiat: false,
  }
}

export function getEarnFiatPercentageInput({
  balanceUsd,
  convertUsdToLocalFiat,
  fiatDecimals = 2,
  percentage,
}: {
  balanceUsd: number
  convertUsdToLocalFiat: (balanceUsd: number) => number
  fiatDecimals?: number
  percentage: number
}): string {
  return (convertUsdToLocalFiat(balanceUsd) * percentage).toFixed(fiatDecimals)
}

export function getEarnAmountValidation({
  availableAmount,
  comparisonAmount,
  hasRequiredSelection = true,
  inputAmount,
  isConversionPending = false,
}: {
  availableAmount: number
  comparisonAmount: number | undefined
  hasRequiredSelection?: boolean
  inputAmount: number
  isConversionPending?: boolean
}): {
  hasAmount: boolean
  isOverBalance: boolean
  isReviewDisabled: boolean
} {
  const hasAmount = inputAmount > 0
  const isOverBalance = comparisonAmount !== undefined && comparisonAmount > availableAmount
  const isReviewDisabled =
    !hasAmount || !hasRequiredSelection || comparisonAmount === undefined || isConversionPending || isOverBalance

  return { hasAmount, isOverBalance, isReviewDisabled }
}

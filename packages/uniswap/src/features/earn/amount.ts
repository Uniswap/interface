import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionShareBalance } from 'uniswap/src/features/earn/utils'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

const BIGINT_ZERO = BigInt(0)
const RAW_RATIO_SCALE = BigInt(1_000_000_000_000_000_000)

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

export function getEarnDepositPercentageInput({
  balanceQuantity,
  balanceUsd,
  convertUsdToLocalFiat,
  exactMaxTokenAmount,
  fiatDecimals = 2,
  percentage,
  tokenDecimals,
}: {
  balanceQuantity: number
  balanceUsd: number | undefined
  convertUsdToLocalFiat: (balanceUsd: number) => number
  exactMaxTokenAmount: string | undefined
  fiatDecimals?: number
  percentage: number
  tokenDecimals: number
}): {
  exactAmountFiat: string
  exactAmountToken: string
  inputInFiat: boolean
} {
  const percentageInput = getEarnPercentageInput({
    balanceQuantity,
    balanceUsd,
    convertUsdToLocalFiat,
    fiatDecimals,
    percentage,
    tokenDecimals,
  })

  if (percentage === 1 && exactMaxTokenAmount !== undefined) {
    return {
      ...percentageInput,
      exactAmountToken: exactMaxTokenAmount,
      inputInFiat: false,
    }
  }

  return percentageInput
}

export function getEarnFiatPercentageInput({
  balanceUsd,
  convertUsdToLocalFiat,
  fiatDecimals = 2,
  percentage,
  rounding = 'nearest',
}: {
  balanceUsd: number
  convertUsdToLocalFiat: (balanceUsd: number) => number
  fiatDecimals?: number
  percentage: number
  rounding?: 'down' | 'nearest'
}): string {
  const value = convertUsdToLocalFiat(balanceUsd) * percentage
  if (rounding === 'down') {
    const scale = 10 ** fiatDecimals
    return (Math.floor(value * scale) / scale).toFixed(fiatDecimals)
  }
  return value.toFixed(fiatDecimals)
}

export function getMaxDepositTokenAmount({
  balanceQuantity,
  balanceRaw,
  currency,
}: {
  balanceQuantity: number
  balanceRaw: string | undefined
  currency: Currency
}): string {
  if (balanceRaw) {
    const exactMaxAmount = getCurrencyAmount({ value: balanceRaw, valueType: ValueType.Raw, currency })
    if (exactMaxAmount) {
      return exactMaxAmount.toExact()
    }
  }

  return balanceQuantity.toFixed(currency.decimals)
}

export function getEarnAmountValidation({
  availableAmount,
  comparisonAmount,
  hasRequiredSelection = true,
  inputAmount,
  isConversionPending = false,
  skipOverBalanceCheck = false,
}: {
  availableAmount: number
  comparisonAmount: number | undefined
  hasRequiredSelection?: boolean
  inputAmount: number
  isConversionPending?: boolean
  // Withdrawing the full position via MAX_SHARES redeems whatever shares the owner holds, so the
  // displayed fiat amount (rounded for display) can sit a hair above the available balance without
  // being invalid. Skip the over-balance check in that case so "Max" never reads as insufficient.
  skipOverBalanceCheck?: boolean
}): {
  hasAmount: boolean
  isOverBalance: boolean
  isReviewDisabled: boolean
} {
  const hasAmount = inputAmount > 0
  const isOverBalance = !skipOverBalanceCheck && comparisonAmount !== undefined && comparisonAmount > availableAmount
  const isReviewDisabled =
    !hasAmount || !hasRequiredSelection || comparisonAmount === undefined || isConversionPending || isOverBalance

  return { hasAmount, isOverBalance, isReviewDisabled }
}

export function getEarnDepositMinimumValidation({
  hasInputAmount,
  inputAmount,
  minimumAmount,
}: {
  hasInputAmount?: boolean
  inputAmount: number | undefined
  minimumAmount: number
}): boolean {
  const hasPositiveInput = hasInputAmount ?? (inputAmount !== undefined && inputAmount > 0)
  return inputAmount !== undefined && hasPositiveInput && inputAmount < minimumAmount
}

export function getEarnWithdrawableAmount({
  position,
  vault,
}: {
  position: Pick<EarnPositionInfo, 'depositedRaw' | 'depositedUsd'>
  vault: Pick<EarnVaultInfo, 'liquidityRaw' | 'liquidityUsd'>
}): {
  availableRaw: string
  availableUsd: number
  isLiquidityLimited: boolean
} {
  const depositedRaw = parseRawAmount(position.depositedRaw)
  const liquidityRaw = parseRawAmount(vault.liquidityRaw)

  if (
    depositedRaw === undefined ||
    depositedRaw <= BIGINT_ZERO ||
    liquidityRaw === undefined ||
    liquidityRaw >= depositedRaw
  ) {
    return {
      availableRaw: position.depositedRaw,
      availableUsd: position.depositedUsd,
      isLiquidityLimited: false,
    }
  }

  return {
    availableRaw: liquidityRaw.toString(),
    availableUsd: getLimitedWithdrawableUsd({
      depositedRaw,
      depositedUsd: position.depositedUsd,
      liquidityRaw,
      liquidityUsd: vault.liquidityUsd,
    }),
    isLiquidityLimited: true,
  }
}

function parseRawAmount(value: string | undefined): bigint | undefined {
  if (!value) {
    return undefined
  }
  try {
    const parsed = BigInt(value)
    return parsed >= BIGINT_ZERO ? parsed : undefined
  } catch {
    return undefined
  }
}

function getLimitedWithdrawableUsd({
  depositedRaw,
  depositedUsd,
  liquidityRaw,
  liquidityUsd,
}: {
  depositedRaw: bigint
  depositedUsd: number
  liquidityRaw: bigint
  liquidityUsd: number
}): number {
  if (liquidityRaw === BIGINT_ZERO) {
    return 0
  }
  if (Number.isFinite(liquidityUsd) && liquidityUsd > 0) {
    return Math.min(liquidityUsd, depositedUsd)
  }

  const scaledRatio = Number((liquidityRaw * RAW_RATIO_SCALE) / depositedRaw) / Number(RAW_RATIO_SCALE)
  return depositedUsd * scaledRatio
}

export function getEarnWithdrawInputAmount({
  currency,
  exactAssetsAmount,
  position,
  withdrawMode,
}: {
  currency: Currency | undefined
  exactAssetsAmount: CurrencyAmount<Currency> | null | undefined
  position: Pick<EarnPositionInfo, 'depositedRaw' | 'sharesRaw'>
  withdrawMode: TradingApi.EarnWithdrawMode
}): CurrencyAmount<Currency> | undefined {
  if (withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES) {
    if (!hasConfirmedEarnPositionShareBalance(position)) {
      return undefined
    }

    return (
      getCurrencyAmount({
        value: position.sharesRaw,
        valueType: ValueType.Raw,
        currency,
      }) ?? undefined
    )
  }

  return exactAssetsAmount ?? undefined
}

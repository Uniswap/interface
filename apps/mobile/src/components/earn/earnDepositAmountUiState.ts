import type { AppTFunction } from 'ui/src/i18n/types'
import { NumberType } from 'utilities/src/format/types'

export function getIsEarnAmountConversionPending({
  exactAmountFiat,
  hasInputAmount,
  isFiatInput,
}: {
  exactAmountFiat: string
  hasInputAmount: boolean
  isFiatInput: boolean
}): boolean {
  return !isFiatInput && hasInputAmount && !exactAmountFiat
}

export function getEarnDepositAmountUiState({
  formatNumberOrString,
  hasAmount,
  hasConfirmedWithdrawPosition,
  isBelowMinimumDeposit,
  isOverBalance,
  isOverWithdrawableLiquidity,
  isReviewDisabled,
  isWithdrawing,
  minimumDepositLocalFiat,
  showOverWithdrawableLiquidityInlineError,
  showMinimumDepositInlineError,
  t,
  withdrawLiquidityAvailableAmount,
}: {
  formatNumberOrString: (params: { value: number; type: NumberType }) => string
  hasAmount: boolean
  hasConfirmedWithdrawPosition: boolean
  isBelowMinimumDeposit: boolean
  isOverBalance: boolean
  isOverWithdrawableLiquidity: boolean
  isReviewDisabled: boolean
  isWithdrawing: boolean
  minimumDepositLocalFiat: number
  showOverWithdrawableLiquidityInlineError?: boolean
  showMinimumDepositInlineError?: boolean
  t: AppTFunction
  withdrawLiquidityAvailableAmount?: string
}): { ctaLabel: string; inlineError: string | undefined; isReviewDisabled: boolean } {
  const shouldDisableForMinimumDeposit = !isWithdrawing && isBelowMinimumDeposit
  // Callers that do not debounce inline errors can omit this and use the synchronous disabled state.
  const shouldShowMinimumDepositError = showMinimumDepositInlineError ?? shouldDisableForMinimumDeposit
  const inlineError = getInlineError({
    formatNumberOrString,
    isOverWithdrawableLiquidity: showOverWithdrawableLiquidityInlineError ?? isOverWithdrawableLiquidity,
    minimumDepositLocalFiat,
    shouldShowMinimumDepositError,
    t,
    withdrawLiquidityAvailableAmount,
  })

  return {
    ctaLabel: getCtaLabel({
      hasAmount,
      hasConfirmedWithdrawPosition,
      isBelowMinimumDeposit: shouldDisableForMinimumDeposit,
      isOverBalance,
      isOverWithdrawableLiquidity,
      isWithdrawing,
      t,
    }),
    inlineError,
    isReviewDisabled: isReviewDisabled || shouldDisableForMinimumDeposit || isOverWithdrawableLiquidity,
  }
}

function getInlineError({
  formatNumberOrString,
  isOverWithdrawableLiquidity,
  minimumDepositLocalFiat,
  shouldShowMinimumDepositError,
  t,
  withdrawLiquidityAvailableAmount,
}: {
  formatNumberOrString: (params: { value: number; type: NumberType }) => string
  isOverWithdrawableLiquidity: boolean
  minimumDepositLocalFiat: number
  shouldShowMinimumDepositError: boolean
  t: AppTFunction
  withdrawLiquidityAvailableAmount?: string
}): string | undefined {
  if (isOverWithdrawableLiquidity) {
    return t('explore.earn.withdraw.lowLiquidity.available', {
      amount: withdrawLiquidityAvailableAmount ?? '',
    })
  }
  if (shouldShowMinimumDepositError) {
    return t('explore.earn.deposit.minimum', {
      amount: formatNumberOrString({ value: minimumDepositLocalFiat, type: NumberType.FiatStandard }),
    })
  }
  return undefined
}

function getCtaLabel({
  hasAmount,
  hasConfirmedWithdrawPosition,
  isBelowMinimumDeposit,
  isOverBalance,
  isOverWithdrawableLiquidity,
  isWithdrawing,
  t,
}: {
  hasAmount: boolean
  hasConfirmedWithdrawPosition: boolean
  isBelowMinimumDeposit: boolean
  isOverBalance: boolean
  isOverWithdrawableLiquidity: boolean
  isWithdrawing: boolean
  t: AppTFunction
}): string {
  if (isWithdrawing && hasAmount && !hasConfirmedWithdrawPosition) {
    return t('common.loading')
  }
  if (isOverBalance) {
    if (isOverWithdrawableLiquidity) {
      return t('explore.earn.withdraw.lowLiquidity.cta')
    }
    return t('explore.earn.deposit.insufficientBalance')
  }
  if (!hasAmount) {
    return t('common.noAmount.error')
  }
  if (isBelowMinimumDeposit) {
    return t('explore.earn.deposit.enterLargerAmount')
  }
  return t('common.button.review')
}

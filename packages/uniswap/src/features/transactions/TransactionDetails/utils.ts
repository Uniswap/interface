import { Percent } from '@uniswap/sdk-core'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  TokenProtectionWarning,
  getFeeWarning,
  getIsFeeRelatedWarning,
  getSeverityFromTokenProtectionWarning,
  getTokenProtectionWarning,
} from 'uniswap/src/features/tokens/safetyUtils'
import {
  FeeOnTransferFeeGroupProps,
  TokenFeeInfo,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function getFeeSeverity(fee: Percent): {
  severity: WarningSeverity
  tokenProtectionWarning: TokenProtectionWarning
} {
  // WarningSeverity for styling. Same logic as getTokenWarningSeverity but without non-fee-related cases.
  // If fee >= 5% then HIGH, else 0% < fee < 5% then MEDIUM, else NONE
  const tokenProtectionWarning = getFeeWarning(fee)
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  return { severity, tokenProtectionWarning }
}

export function getHighestFeeSeverity(feeOnTransferProps: FeeOnTransferFeeGroupProps | undefined): {
  highestFeeTokenInfo?: TokenFeeInfo
  tokenProtectionWarning: TokenProtectionWarning
  severity: WarningSeverity
} {
  if (!feeOnTransferProps) {
    return { severity: WarningSeverity.None, tokenProtectionWarning: TokenProtectionWarning.None }
  }

  const { inputTokenInfo, outputTokenInfo } = feeOnTransferProps
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return { severity: WarningSeverity.None, tokenProtectionWarning: TokenProtectionWarning.None }
  }

  const highestFeeTokenInfo = inputTokenInfo.fee.greaterThan(outputTokenInfo.fee) ? inputTokenInfo : outputTokenInfo
  return { highestFeeTokenInfo, ...getFeeSeverity(highestFeeTokenInfo.fee) }
}

export function getShouldDisplayTokenWarningCard({
  feeSeverity,
  feeWarning,
  severity,
  tokenProtectionWarning,
}: {
  severity: WarningSeverity
  tokenProtectionWarning: TokenProtectionWarning
  feeSeverity: WarningSeverity
  feeWarning: TokenProtectionWarning
}): {
  shouldDisplayTokenWarningCard: boolean
  severityToDisplay: WarningSeverity
  tokenProtectionWarningToDisplay: TokenProtectionWarning
} {
  const feeWarningMoreSevere = feeWarning > tokenProtectionWarning
  const showFeeSeverityWarning =
    feeWarningMoreSevere || (getIsFeeRelatedWarning(tokenProtectionWarning) && feeSeverity === severity)
  const severityToDisplay = showFeeSeverityWarning ? feeSeverity : severity
  const tokenProtectionWarningToDisplay = showFeeSeverityWarning ? feeWarning : tokenProtectionWarning
  return {
    shouldDisplayTokenWarningCard: severityToDisplay === WarningSeverity.High,
    severityToDisplay,
    tokenProtectionWarningToDisplay,
  }
}

export function getRelevantTokenWarningSeverity(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
): TokenWarningProps {
  // New logic is to only ever show the outputWarning in a TokenWarningCard on SwapReview. Keeping this helper function for convenience.
  const outputCurrency = acceptedDerivedSwapInfo?.currencies.output
  const outputWarning = getTokenProtectionWarning(outputCurrency)
  const outputSeverity = getSeverityFromTokenProtectionWarning(outputWarning)

  return {
    currencyInfo: outputCurrency,
    tokenProtectionWarning: outputWarning,
    severity: outputSeverity,
  }
}

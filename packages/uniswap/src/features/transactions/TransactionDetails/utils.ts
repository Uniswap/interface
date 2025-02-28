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
  FoTFeeType,
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
  const tokenProtectionWarning = getFeeWarning(parseFloat(fee.toFixed()))
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  return { severity, tokenProtectionWarning }
}

export function getHighestFeeSeverity(feeOnTransferProps: FeeOnTransferFeeGroupProps | undefined): {
  highestFeeTokenInfo?: TokenFeeInfo
  tokenProtectionWarning: TokenProtectionWarning
  severity: WarningSeverity
  feeType?: FoTFeeType
} {
  if (!feeOnTransferProps) {
    return { severity: WarningSeverity.None, tokenProtectionWarning: TokenProtectionWarning.None }
  }

  const { inputTokenInfo, outputTokenInfo } = feeOnTransferProps
  if (!inputTokenInfo.fee.greaterThan(0) && !outputTokenInfo.fee.greaterThan(0)) {
    return { severity: WarningSeverity.None, tokenProtectionWarning: TokenProtectionWarning.None }
  }

  const isInputFeeHigher = inputTokenInfo.fee.greaterThan(outputTokenInfo.fee)
  const feeType = isInputFeeHigher ? 'sell' : 'buy'
  const highestFeeTokenInfo = isInputFeeHigher ? inputTokenInfo : outputTokenInfo
  return { feeType, highestFeeTokenInfo, ...getFeeSeverity(highestFeeTokenInfo.fee) }
}

export function getShouldDisplayTokenWarningCard({
  feeOnTransferProps,
  tokenWarningProps,
}: {
  tokenWarningProps: TokenWarningProps
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
}): {
  shouldDisplayTokenWarningCard: boolean
  tokenProtectionWarningToDisplay: TokenProtectionWarning
  feePercent: number | undefined
  feeType: FoTFeeType | undefined
  tokenFeeInfo: TokenFeeInfo | undefined
  currencyInfoToDisplay: Maybe<CurrencyInfo>
  showFeeSeverityWarning: boolean
} {
  const { tokenProtectionWarning, severity, currencyInfo } = tokenWarningProps

  const {
    severity: feeSeverity,
    tokenProtectionWarning: feeWarning,
    highestFeeTokenInfo,
    feeType,
  } = getHighestFeeSeverity(feeOnTransferProps)
  const feePercent = highestFeeTokenInfo ? parseFloat(highestFeeTokenInfo.fee.toFixed()) : undefined

  const feeWarningMoreSevere = feeWarning > tokenProtectionWarning
  const tokenWarningIsFeeRelated = getIsFeeRelatedWarning(tokenProtectionWarning)
  const tokenFeeWarningNotRelevant =
    tokenWarningIsFeeRelated &&
    (feeSeverity === severity || (severity < WarningSeverity.Medium && !highestFeeTokenInfo))

  // We want to show the feeWarning over the tokenWarning IF
  // 1) the fewWarning is a higher priority than the tokenWarning
  // 2) if the tokenWarning is fee-related and feeWarning and tokenWarning of are equal severity, since the feeWarning's fee % is fresher (simulated trade from TradingApi)
  // 3) if the tokenWarning is fee-related, it is low severity (< 15% fee), but there is no feeWarning from txn simulation
  // (i.e. the token has a low severity buy tax but we're selling the token -- this would hide the buy tax warning)
  const showFeeSeverityWarning = feeWarningMoreSevere || tokenFeeWarningNotRelevant
  const severityToDisplay = showFeeSeverityWarning ? feeSeverity : severity
  const tokenProtectionWarningToDisplay = showFeeSeverityWarning ? feeWarning : tokenProtectionWarning
  const currencyInfoToDisplay = showFeeSeverityWarning ? highestFeeTokenInfo?.currencyInfo : currencyInfo
  return {
    shouldDisplayTokenWarningCard: severityToDisplay === WarningSeverity.High,
    tokenProtectionWarningToDisplay,
    feePercent,
    feeType,
    tokenFeeInfo: highestFeeTokenInfo,
    currencyInfoToDisplay,
    showFeeSeverityWarning,
  }
}

export function getRelevantTokenWarningSeverity(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
): TokenWarningProps {
  // We only care about a non-fee-related warning on the output token, since the user already owns the input token, so only sell-tax warning are relevant
  const outputCurrency = acceptedDerivedSwapInfo?.currencies.output
  const outputWarning = getTokenProtectionWarning(outputCurrency)
  const outputSeverity = getSeverityFromTokenProtectionWarning(outputWarning)

  return {
    currencyInfo: outputCurrency,
    tokenProtectionWarning: outputWarning,
    severity: outputSeverity,
  }
}

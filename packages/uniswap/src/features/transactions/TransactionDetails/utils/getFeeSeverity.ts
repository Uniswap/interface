import { Percent } from '@uniswap/sdk-core'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getFeeWarning, getSeverityFromTokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import {
  FeeOnTransferFeeGroupProps,
  FoTFeeType,
  TokenFeeInfo,
} from 'uniswap/src/features/transactions/TransactionDetails/types'

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

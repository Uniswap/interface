import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  getSeverityFromTokenProtectionWarning,
  getTokenProtectionWarning,
} from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { TokenWarningProps } from 'uniswap/src/features/transactions/TransactionDetails/types'

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

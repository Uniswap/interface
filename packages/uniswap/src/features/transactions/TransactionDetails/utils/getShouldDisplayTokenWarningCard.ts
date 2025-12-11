import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getIsFeeRelatedWarning } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import {
  FeeOnTransferFeeGroupProps,
  FoTFeeType,
  TokenFeeInfo,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getHighestFeeSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getFeeSeverity'

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
  // 1) the feeWarning is a higher priority than the tokenWarning
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

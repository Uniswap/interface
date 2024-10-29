import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import { getIsFeeRelatedWarning } from 'uniswap/src/features/tokens/safetyUtils'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import {
  getHighestFeeSeverity,
  getShouldDisplayTokenWarningCard,
} from 'uniswap/src/features/transactions/TransactionDetails/utils'

type FeeOnTransferWarningCardProps = {
  checked: boolean
  setChecked: (checked: boolean) => void
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  tokenWarningProps: TokenWarningProps
}

export function SwapReviewTokenWarningCard({
  feeOnTransferProps,
  tokenWarningProps,
  checked,
  setChecked,
}: FeeOnTransferWarningCardProps): JSX.Element | null {
  const { currencyInfo, severity, tokenProtectionWarning } = tokenWarningProps
  const {
    severity: feeSeverity,
    tokenProtectionWarning: feeWarning,
    highestFeeTokenInfo,
  } = getHighestFeeSeverity(feeOnTransferProps)

  const showFeeSeverityWarning = getIsFeeRelatedWarning(tokenProtectionWarning)
  const { shouldDisplayTokenWarningCard, tokenProtectionWarningToDisplay } = getShouldDisplayTokenWarningCard({
    severity,
    tokenProtectionWarning,
    feeSeverity,
    feeWarning,
  })
  const feePercent = highestFeeTokenInfo ? parseFloat(highestFeeTokenInfo.fee.toFixed()) : undefined

  if (!shouldDisplayTokenWarningCard || (showFeeSeverityWarning && !highestFeeTokenInfo)) {
    return null
  }

  return (
    <TokenWarningCard
      hideCtaIcon
      currencyInfo={currencyInfo}
      tokenProtectionWarningOverride={tokenProtectionWarningToDisplay}
      feePercentOverride={showFeeSeverityWarning ? feePercent : undefined}
      checked={checked}
      setChecked={setChecked}
    />
  )
}

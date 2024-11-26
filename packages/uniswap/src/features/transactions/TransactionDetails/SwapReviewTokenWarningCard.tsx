import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils'

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
  const {
    showFeeSeverityWarning,
    shouldDisplayTokenWarningCard,
    tokenProtectionWarningToDisplay,
    feePercent,
    currencyInfoToDisplay,
  } = getShouldDisplayTokenWarningCard({
    tokenWarningProps,
    feeOnTransferProps,
  })

  if (!shouldDisplayTokenWarningCard) {
    return null
  }

  return (
    <TokenWarningCard
      hideCtaIcon
      currencyInfo={currencyInfoToDisplay}
      tokenProtectionWarningOverride={tokenProtectionWarningToDisplay}
      feePercentOverride={showFeeSeverityWarning ? feePercent : undefined}
      checked={checked}
      setChecked={setChecked}
    />
  )
}

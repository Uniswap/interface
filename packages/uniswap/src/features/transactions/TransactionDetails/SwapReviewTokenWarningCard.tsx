import { useState } from 'react'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getShouldDisplayTokenWarningCard } from 'uniswap/src/features/transactions/TransactionDetails/utils/getShouldDisplayTokenWarningCard'

type SwapReviewTokenWarningCardProps = {
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
}: SwapReviewTokenWarningCardProps): JSX.Element | null {
  const [showModal, setShowModal] = useState(false)
  const {
    showFeeSeverityWarning,
    shouldDisplayTokenWarningCard,
    tokenProtectionWarningToDisplay,
    feePercent,
    feeType,
    currencyInfoToDisplay,
    tokenFeeInfo,
  } = getShouldDisplayTokenWarningCard({
    tokenWarningProps,
    feeOnTransferProps,
  })

  if (!shouldDisplayTokenWarningCard || !currencyInfoToDisplay) {
    return null
  }

  const feeOnTransferOverride =
    showFeeSeverityWarning && tokenFeeInfo && feeType
      ? {
          buyFeePercent: feeType === 'buy' ? feePercent : undefined,
          sellFeePercent: feeType === 'sell' ? feePercent : undefined,
        }
      : undefined

  const onPress = (): void => {
    setShowModal(true)
  }
  const onClose = (): void => {
    setShowModal(false)
  }

  return (
    <>
      <TokenWarningCard
        hideCtaIcon
        currencyInfo={currencyInfoToDisplay}
        tokenProtectionWarningOverride={tokenProtectionWarningToDisplay}
        feeOnTransferOverride={feeOnTransferOverride}
        checked={checked}
        setChecked={setChecked}
        onPress={onPress}
      />
      <TokenWarningModal
        isInfoOnlyWarning
        isVisible={showModal}
        currencyInfo0={currencyInfoToDisplay}
        feeOnTransferOverride={feeOnTransferOverride}
        closeModalOnly={onClose}
        onAcknowledge={onClose}
      />
    </>
  )
}

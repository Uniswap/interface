import React, { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { DeprecatedButton } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/selectors'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendFormButton({
  setShowViewOnlyModal,
  setShowMaxTransferModal,
  goToReviewScreen,
}: {
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
  setShowMaxTransferModal: Dispatch<SetStateAction<boolean>>
  goToReviewScreen: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()

  const hasDismissedLowNetworkTokenWarning = useSelector(selectHasDismissedLowNetworkTokenWarning)

  const {
    warnings,
    recipient,
    isMax,
    derivedSendInfo: { chainId, currencyInInfo },
  } = useSendContext()
  const { walletNeedsRestore } = useTransactionModalContext()

  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const actionButtonDisabled = !!warnings.blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore

  const onPressReview = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
      return
    }

    if (!hasDismissedLowNetworkTokenWarning && isMax && currencyInInfo?.currency.isNative) {
      sendAnalyticsEvent(WalletEventName.LowNetworkTokenInfoModalOpened, { location: 'send' })
      setShowMaxTransferModal(true)
      return
    }

    goToReviewScreen()
  }, [
    isViewOnlyWallet,
    goToReviewScreen,
    setShowViewOnlyModal,
    isMax,
    hasDismissedLowNetworkTokenWarning,
    setShowMaxTransferModal,
    currencyInInfo,
  ])

  const nativeCurrencySymbol = NativeCurrency.onChain(chainId).symbol

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol,
      })
    : t('send.button.review')

  return (
    <DeprecatedButton
      isDisabled={actionButtonDisabled && !isViewOnlyWallet}
      // Override opacity only for view-only wallets
      opacity={isViewOnlyWallet ? 0.4 : undefined}
      size="large"
      testID={TestID.ReviewTransfer}
      onPress={onPressReview}
    >
      {buttonText}
    </DeprecatedButton>
  )
}

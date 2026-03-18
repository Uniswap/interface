import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Button, Flex } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/selectors'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useDismissedCompatibleAddressWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { isAmountGreaterThanZero } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendFormButton({
  setShowViewOnlyModal,
  setShowMaxTransferModal,
  setShowCompatibleAddressModal,
  goToReviewScreen,
}: {
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
  setShowMaxTransferModal: Dispatch<SetStateAction<boolean>>
  setShowCompatibleAddressModal: Dispatch<SetStateAction<boolean>>
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
    exactAmountToken,
    exactAmountFiat,
  } = useSendContext()
  const { walletNeedsRestore } = useTransactionModalContext()
  const hasValueGreaterThanZero = useMemo(() => {
    return isAmountGreaterThanZero({
      exactAmountToken,
      exactAmountFiat,
      currency: currencyInInfo?.currency,
    })
  }, [exactAmountToken, exactAmountFiat, currencyInInfo?.currency])

  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading
  const { tokenWarningDismissed: isCompatibleAddressDismissed } = useDismissedCompatibleAddressWarnings(
    currencyInInfo?.currency,
  )
  const isUnichainBridgedAsset = Boolean(currencyInInfo?.isBridged) && !isCompatibleAddressDismissed

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const actionButtonDisabled =
    !!warnings.blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore || !hasValueGreaterThanZero

  const onPressReview = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
      return
    }

    if (!hasDismissedLowNetworkTokenWarning && isMax && currencyInInfo?.currency.isNative) {
      sendAnalyticsEvent(UniswapEventName.LowNetworkTokenInfoModalOpened, { location: 'send' })
      setShowMaxTransferModal(true)
      return
    }

    if (isUnichainBridgedAsset) {
      setShowCompatibleAddressModal(true)
      return
    }

    goToReviewScreen()
  }, [
    isViewOnlyWallet,
    hasDismissedLowNetworkTokenWarning,
    isMax,
    currencyInInfo?.currency.isNative,
    isUnichainBridgedAsset,
    goToReviewScreen,
    setShowViewOnlyModal,
    setShowMaxTransferModal,
    setShowCompatibleAddressModal,
  ])

  const nativeCurrencySymbol = nativeOnChain(chainId).symbol ?? ''

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol,
      })
    : t('send.button.review')

  return (
    <Flex centered row>
      <Button
        isDisabled={actionButtonDisabled && !isViewOnlyWallet}
        variant="branded"
        // Override opacity only for view-only wallets
        opacity={isViewOnlyWallet ? 0.4 : undefined}
        size="large"
        testID={TestID.ReviewTransfer}
        onPress={onPressReview}
      >
        {buttonText}
      </Button>
    </Flex>
  )
}

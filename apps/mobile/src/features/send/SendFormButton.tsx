import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Button, Flex, Text } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { selectHasDismissedLowNetworkTokenWarning } from 'uniswap/src/features/behaviorHistory/selectors'
import { useIsPermissionedSendBlocked } from 'uniswap/src/features/permissionedTokens/useIsPermissionedSendBlocked'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useDismissedCompatibleAddressWarnings } from 'uniswap/src/features/tokens/warnings/slice/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useIsSendButtonDisabled } from 'wallet/src/features/transactions/send/hooks/useIsSendButtonDisabled'
import { isAmountGreaterThanZero } from 'wallet/src/features/transactions/utils'
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
    isMax,
    derivedSendInfo: { chainId, currencyInInfo, recipient },
    exactAmountToken,
    exactAmountFiat,
  } = useSendContext()
  const hasValueGreaterThanZero = useMemo(() => {
    return isAmountGreaterThanZero({
      exactAmountToken,
      exactAmountFiat,
      currency: currencyInInfo?.currency,
    })
  }, [exactAmountToken, exactAmountFiat, currencyInInfo?.currency])

  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { tokenWarningDismissed: isCompatibleAddressDismissed } = useDismissedCompatibleAddressWarnings(
    currencyInInfo?.currency,
  )
  const isUnichainBridgedAsset = Boolean(currencyInInfo?.isBridged) && !isCompatibleAddressDismissed

  const sendCurrency = currencyInInfo?.currency
  const { isPermissionedSendBlocked, isPermissionedSendBlockedLoading, permissionedSendBlockReason } =
    useIsPermissionedSendBlocked({
      sendCurrency,
      senderAddress: account.address,
      recipientAddress: recipient,
    })
  // Disable the button while the KYC check is in flight so it doesn't briefly flip enabled before the banner appears.
  const isPermissionedButtonGate = isPermissionedSendBlocked || isPermissionedSendBlockedLoading

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const { isDisabled: actionButtonDisabled } = useIsSendButtonDisabled({ hasValueGreaterThanZero })

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
    <Flex gap="$spacing12">
      {isPermissionedSendBlocked && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" gap="$spacing12">
          <Lock size="$icon.20" color="$neutral2" flexShrink={0} />
          <Flex flex={1} gap="$spacing2">
            <Text variant="body3" color="$neutral1">
              {permissionedSendBlockReason === 'sender'
                ? t('permissionedPool.send.senderNotAllowlisted.title')
                : t('permissionedPool.send.recipientNotAllowlisted.title')}
            </Text>
            <Text variant="body3" color="$neutral2">
              {permissionedSendBlockReason === 'sender'
                ? t('permissionedPool.send.senderNotAllowlisted.message', {
                    tokenSymbol: sendCurrency?.symbol ?? '',
                  })
                : t('permissionedPool.send.recipientNotAllowlisted.message', {
                    tokenSymbol: sendCurrency?.symbol ?? '',
                  })}
            </Text>
          </Flex>
        </Flex>
      )}
      <Flex centered row>
        <Button
          disabled={(actionButtonDisabled || isPermissionedButtonGate) && !isViewOnlyWallet}
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
    </Flex>
  )
}

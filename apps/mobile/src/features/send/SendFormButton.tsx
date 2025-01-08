import React, { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendFormButton({
  setShowViewOnlyModal,
}: {
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()

  const {
    warnings,
    recipient,
    updateSendForm,
    derivedSendInfo: { chainId },
  } = useSendContext()
  const { setScreen, walletNeedsRestore } = useTransactionModalContext()

  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const insufficientGasFunds = warnings.warnings.some((warning) => warning.type === WarningLabel.InsufficientGasFunds)

  const actionButtonDisabled = !!warnings.blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    updateSendForm({ txId })
    setScreen(TransactionScreen.Review)
  }, [setScreen, updateSendForm])

  const onPressReview = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
    } else {
      goToNext()
    }
  }, [isViewOnlyWallet, goToNext, setShowViewOnlyModal])

  const nativeCurrencySymbol = NativeCurrency.onChain(chainId).symbol

  const buttonText = insufficientGasFunds
    ? t('send.warning.insufficientFunds.title', {
        currencySymbol: nativeCurrencySymbol,
      })
    : t('send.button.review')

  return (
    <Button
      disabled={actionButtonDisabled && !isViewOnlyWallet}
      // Override opacity only for view-only wallets
      opacity={isViewOnlyWallet ? 0.4 : undefined}
      size="large"
      testID={TestID.ReviewTransfer}
      onPress={onPressReview}
    >
      {buttonText}
    </Button>
  )
}

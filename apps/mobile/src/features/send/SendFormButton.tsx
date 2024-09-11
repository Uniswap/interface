import React, { Dispatch, SetStateAction, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { WarningAction } from 'uniswap/src/features/transactions/WarningModal/types'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { SendScreen, useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendFormButton({
  setShowViewOnlyModal,
}: {
  setShowViewOnlyModal: Dispatch<SetStateAction<boolean>>
}): JSX.Element {
  const { t } = useTranslation()
  const account = useActiveAccountWithThrow()

  const { setScreen, warnings, recipient, updateSendForm } = useSendContext()
  const { walletNeedsRestore } = useTransactionModalContext()

  const isViewOnlyWallet = account.type === AccountType.Readonly

  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const actionButtonDisabled =
    warnings.warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    updateSendForm({ txId })
    setScreen(SendScreen.SendReview)
  }, [setScreen, updateSendForm])

  const onPressReview = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
    } else {
      goToNext()
    }
  }, [isViewOnlyWallet, goToNext, setShowViewOnlyModal])

  return (
    <Button
      disabled={actionButtonDisabled && !isViewOnlyWallet}
      // Override opacity only for view-only wallets
      opacity={isViewOnlyWallet ? 0.4 : undefined}
      size="large"
      testID={TestID.ReviewTransfer}
      onPress={onPressReview}
    >
      {t('send.button.review')}
    </Button>
  )
}

import { Pair, PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import React, { useCallback, useState } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../../../TransactionConfirmationModal'
import ConfirmStakingModalFooter from '../ModalBase/Footer'
import ConfirmStakingWithdrawingModalHeader from '../ModalBase/Header'

interface ConfirmWithdrawalModalProps {
  stakablePair?: Pair | null
  isOpen: boolean
  withdrawablTokenBalance?: PricedTokenAmount
  attemptingTxn: boolean
  txHash: string
  onConfirm: (amount: TokenAmount) => void
  onDismiss: () => void
  errorMessage: string
}

export default function ConfirmWithdrawalModal({
  stakablePair,
  isOpen,
  attemptingTxn,
  txHash,
  errorMessage,
  withdrawablTokenBalance,
  onDismiss,
  onConfirm
}: ConfirmWithdrawalModalProps) {
  const [withdrawableAmount, setWithdrawableAmount] = useState<TokenAmount | null>(null)

  const handleWithdrawableAmountChange = useCallback(amount => {
    setWithdrawableAmount(amount)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!withdrawableAmount) return
    onConfirm(withdrawableAmount)
  }, [onConfirm, withdrawableAmount])

  const topContent = useCallback(
    () => (
      <ConfirmStakingWithdrawingModalHeader
        maximumAmount={withdrawablTokenBalance}
        onAmountChange={handleWithdrawableAmountChange}
        stakablePair={stakablePair}
      />
    ),
    [handleWithdrawableAmountChange, stakablePair, withdrawablTokenBalance]
  )

  const content = useCallback(
    () =>
      errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={errorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm withdrawal"
          onDismiss={onDismiss}
          topContent={topContent}
          bottomContent={() => (
            <ConfirmStakingModalFooter
              disabledConfirm={
                !withdrawableAmount ||
                withdrawableAmount.equalTo('0') ||
                !withdrawablTokenBalance ||
                withdrawableAmount.greaterThan(withdrawablTokenBalance)
              }
              stakablePair={stakablePair}
              showApprove={false}
              onConfirm={handleConfirm}
            />
          )}
        />
      ),
    [errorMessage, handleConfirm, onDismiss, stakablePair, topContent, withdrawablTokenBalance, withdrawableAmount]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={content}
      pendingText={`Withdrawing ${withdrawableAmount?.toSignificant(6)}`}
    />
  )
}

import { Pair, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { ApprovalState, useApproveCallback } from '../../../../hooks/useApproveCallback'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../../TransactionConfirmationModal'
import ConfirmStakingModalFooter from './Footer'
import ConfirmStakingModalHeader from './Header'

interface ConfirmStakingModalProps {
  stakablePair?: Pair | null
  isOpen: boolean
  stakableTokenBalance?: TokenAmount
  attemptingTxn: boolean
  txHash: string
  distributionContractAddress: string
  onConfirm: (amount: TokenAmount) => void
  onDismiss: () => void
  errorMessage: string
}

export default function ConfirmStakingModal({
  stakablePair,
  isOpen,
  attemptingTxn,
  txHash,
  errorMessage,
  stakableTokenBalance,
  distributionContractAddress,
  onDismiss,
  onConfirm
}: ConfirmStakingModalProps) {
  const [stakedAmount, setStakedAmount] = useState<TokenAmount | null>(null)
  const [approvalState, approveCallback] = useApproveCallback(
    stakablePair ? new TokenAmount(stakablePair.liquidityToken, '100000000000000000000000') : undefined,
    distributionContractAddress
  )
  console.log(approvalState)

  const handleStakedAmountChange = useCallback(amount => {
    setStakedAmount(amount)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!stakedAmount) return
    onConfirm(stakedAmount)
  }, [onConfirm, stakedAmount])

  const topContent = useCallback(
    () => (
      <ConfirmStakingModalHeader
        stakedAmount={stakedAmount}
        stakableTokenBalance={stakableTokenBalance}
        onStakedAmountChange={handleStakedAmountChange}
        stakablePair={stakablePair}
      />
    ),
    [handleStakedAmountChange, stakablePair, stakableTokenBalance, stakedAmount]
  )

  const content = useCallback(
    () =>
      errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={errorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm staking"
          onDismiss={onDismiss}
          topContent={topContent}
          bottomContent={() => (
            <ConfirmStakingModalFooter
              disabledConfirm={
                !stakedAmount ||
                stakedAmount.equalTo('0') ||
                !stakableTokenBalance ||
                stakedAmount.greaterThan(stakableTokenBalance) ||
                approvalState !== ApprovalState.APPROVED
              }
              stakablePair={stakablePair}
              disabledApprove={approvalState === ApprovalState.APPROVED}
              onConfirm={handleConfirm}
              onApprove={approveCallback}
            />
          )}
        />
      ),
    [
      approvalState,
      approveCallback,
      errorMessage,
      handleConfirm,
      onDismiss,
      stakablePair,
      stakableTokenBalance,
      stakedAmount,
      topContent
    ]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={content}
      pendingText={`Staking ${stakedAmount?.toSignificant(6)}`}
    />
  )
}

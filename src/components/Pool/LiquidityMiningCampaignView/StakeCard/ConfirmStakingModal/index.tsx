import { Pair, TokenAmount } from '@swapr/sdk'
import React, { useCallback, useState } from 'react'
import { ApprovalState, useApproveCallback } from '../../../../../hooks/useApproveCallback'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../../../TransactionConfirmationModal'
import ConfirmStakingModalFooter from '../ModalBase/Footer'
import ConfirmStakingWithdrawingModalHeader from '../ModalBase/Header'

interface ConfirmStakingModalProps {
  stakablePair?: Pair | null
  isOpen: boolean
  stakableTokenBalance?: TokenAmount
  attemptingTxn: boolean
  txHash: string
  distributionContractAddress: string
  timelocked: boolean
  endingTimestamp: number
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
  timelocked,
  endingTimestamp,
  onDismiss,
  onConfirm
}: ConfirmStakingModalProps) {
  const [stakedAmount, setStakedAmount] = useState<TokenAmount | null>(null)
  const [approvalState, approveCallback] = useApproveCallback(
    stakablePair ? new TokenAmount(stakablePair.liquidityToken, '100000000000000000000000') : undefined,
    distributionContractAddress
  )

  const handleStakedAmountChange = useCallback(amount => {
    setStakedAmount(amount)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!stakedAmount) return
    onConfirm(stakedAmount)
  }, [onConfirm, stakedAmount])

  const topContent = useCallback(
    () => (
      <ConfirmStakingWithdrawingModalHeader
        maximumAmount={stakableTokenBalance}
        onAmountChange={handleStakedAmountChange}
        timelocked={timelocked}
        endingTimestamp={endingTimestamp}
        stakablePair={stakablePair}
      />
    ),
    [handleStakedAmountChange, stakablePair, stakableTokenBalance, timelocked, endingTimestamp]
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
              showApprove
              stakablePair={stakablePair}
              approvalState={approvalState}
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
      pendingText={`Staking ${stakedAmount?.toSignificant(6)} ${stakablePair?.token0.symbol}/${
        stakablePair?.token1.symbol
      } LP tokens`}
    />
  )
}

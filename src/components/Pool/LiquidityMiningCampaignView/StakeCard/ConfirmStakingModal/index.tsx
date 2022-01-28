import { TokenAmount, Token, Pair } from '@swapr/sdk'
import React, { useCallback, useState } from 'react'
import { ApprovalState, useApproveCallback } from '../../../../../hooks/useApproveCallback'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../../../TransactionConfirmationModal'
import ConfirmStakingModalFooter from '../ModalBase/Footer'
import ConfirmStakingWithdrawingModalHeader from '../ModalBase/Header'

interface ConfirmStakingModalProps {
  stakablePair?: any
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
  isSingleSide: boolean
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
  isSingleSide,
  onConfirm
}: ConfirmStakingModalProps) {
  const [stakedAmount, setStakedAmount] = useState<TokenAmount | null>(null)
  const [approvalState, approveCallback] = useApproveCallback(
    stakablePair
      ? new TokenAmount(isSingleSide ? stakablePair : stakablePair.liquidityToken, '100000000000000000000000')
      : undefined,
    distributionContractAddress
  )
  const transactionModalText =
    stakablePair instanceof Token
      ? `${stakablePair.symbol}`
      : stakablePair instanceof Pair
      ? `${stakablePair.token0.symbol}/${stakablePair.token1.symbol}`
      : ''
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
              text={transactionModalText}
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
      stakableTokenBalance,
      stakedAmount,
      topContent,
      transactionModalText
    ]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={content}
      pendingText={`Staking ${stakedAmount?.toSignificant(6)} ${transactionModalText}${' '} ${
        isSingleSide ? 'TOKENS' : 'LP TOKENS'
      }`}
    />
  )
}

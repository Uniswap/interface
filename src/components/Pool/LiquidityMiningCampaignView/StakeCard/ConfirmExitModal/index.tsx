import { Pair, PricedTokenAmount } from '@swapr/sdk'
import React, { useCallback } from 'react'
import { Box, Flex } from 'rebass'
import { TYPE } from '../../../../../theme'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../../../TransactionConfirmationModal'
import ConfirmStakingModalFooter from '../ModalBase/Footer'

interface ConfirmExitModalProps {
  isOpen: boolean
  attemptingTxn: boolean
  stakablePair?: Pair
  stakedTokenBalance?: PricedTokenAmount
  claimableRewards?: PricedTokenAmount[]
  txHash: string
  onConfirm: () => void
  onDismiss: () => void
  errorMessage: string
}

export default function ConfirmExitModal({
  isOpen,
  attemptingTxn,
  stakablePair,
  claimableRewards,
  stakedTokenBalance,
  txHash,
  errorMessage,
  onDismiss,
  onConfirm
}: ConfirmExitModalProps) {
  const topContent = useCallback(
    () => (
      <Flex mt="16px">
        <Box>
          <TYPE.body fontWeight={500} fontSize="12px" color="text5">
            Confirming will withdraw {stakedTokenBalance?.toSignificant(4)} {stakablePair?.token0.symbol}/
            {stakablePair?.token1.symbol} LP tokens and claim{' '}
            {claimableRewards?.map(claimable => `${claimable.toSignificant(4)} ${claimable.token.symbol}`).join(', ')}.
          </TYPE.body>
        </Box>
      </Flex>
    ),
    [claimableRewards, stakablePair, stakedTokenBalance]
  )

  const content = useCallback(
    () =>
      errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={errorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm claim & withdrawal"
          onDismiss={onDismiss}
          topContent={topContent}
          bottomContent={() => (
            <ConfirmStakingModalFooter disabledConfirm={false} showApprove={false} onConfirm={onConfirm} />
          )}
        />
      ),
    [errorMessage, onConfirm, onDismiss, topContent]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={content}
      pendingText="Claiming & withdrawing"
    />
  )
}

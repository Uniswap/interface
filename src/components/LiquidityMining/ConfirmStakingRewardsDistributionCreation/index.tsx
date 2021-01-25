import { Pair, TokenAmount } from 'dxswap-sdk'
import React, { useCallback } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../../TransactionConfirmationModal'
import StakingRewardsDistributionCreationModalFooter from './StakingRewardsDistributionCreationModalFooter'

interface ConfirmStakingRewardsDistributionCreationProps {
  onConfirm: () => void
  onDismiss: () => void
  isOpen: boolean
  attemptingTransaction: boolean
  transactionHash: string | null
  errorMessage: string | null
  liquidityPair: Pair | null
  startTime: Date | null
  endTime: Date | null
  reward: TokenAmount | null
  timelocked: boolean
  unlimitedPool: boolean
}

export default function ConfirmStakingRewardsDistributionCreation({
  onConfirm,
  onDismiss,
  isOpen,
  attemptingTransaction,
  transactionHash,
  errorMessage,
  liquidityPair,
  startTime,
  endTime,
  reward,
  timelocked,
  unlimitedPool
}: ConfirmStakingRewardsDistributionCreationProps) {
  const confirmationContent = useCallback(
    () =>
      errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={errorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm creation"
          onDismiss={onDismiss}
          topContent={() => null}
          bottomContent={() => (
            <StakingRewardsDistributionCreationModalFooter
              onConfirm={onConfirm}
              liquidityPair={liquidityPair}
              startTime={startTime}
              endTime={endTime}
              reward={reward}
              timelocked={timelocked}
              unlimitedPool={unlimitedPool}
            />
          )}
        />
      ),
    [errorMessage, onDismiss, onConfirm, liquidityPair, startTime, endTime, reward, timelocked, unlimitedPool]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTransaction}
      hash={transactionHash || undefined}
      content={confirmationContent}
      pendingText="Creating liquidity mining campaign"
    />
  )
}

import { Pair, TokenAmount } from '@swapr/sdk'
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
  stakingCap: TokenAmount | null
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
  stakingCap,
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
              stakingCap={stakingCap}
              unlimitedPool={unlimitedPool}
            />
          )}
        />
      ),
    [
      errorMessage,
      onDismiss,
      onConfirm,
      liquidityPair,
      startTime,
      endTime,
      reward,
      timelocked,
      stakingCap,
      unlimitedPool
    ]
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

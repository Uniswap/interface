import { buildMigrateTx } from '@uniswap/liquidity-launcher-sdk'
import { useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { useSelectChain } from '~/hooks/useSelectChain'
import { assume0xAddress } from '~/utils/wagmi'

export interface MigrateSubmitState {
  onSubmit: () => Promise<void>
  // Waiting for the wallet signature or the transaction to confirm
  isPending: boolean
  // Wallet signature requested but not yet granted
  isWaitingForWallet: boolean
  // The migrate transaction confirmed in this session
  isConfirmed: boolean
  error: Error | undefined
}

/**
 * Submits the permissionless `LBPStrategy.migrate(auction)` transaction for a graduated
 * auction, built client-side with the SDK's buildMigrateTx (chain switch -> wallet
 * signature -> confirmation). One-shot: the strategy reverts on a second call, so callers
 * should gate on lbp_migration_tx_hash / isConfirmed.
 */
export function useMigrateSubmit({
  onTransactionConfirmed,
}: {
  onTransactionConfirmed?: () => void
}): MigrateSubmitState {
  const { auctionAddress, chainId, lbpStrategyAddress } = useAuctionStore((state) => ({
    auctionAddress: state.auctionDetails?.address,
    chainId: state.auctionDetails?.chainId,
    lbpStrategyAddress: state.auctionDetails?.lbpStrategyAddress,
  }))
  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const { setAuctionDetails } = useAuctionStoreActions()
  const selectChain = useSelectChain()
  const { sendTransactionAsync, isPending: isWaitingForWallet } = useSendTransaction()
  const [submittedTxHash, setSubmittedTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  const { isLoading: isConfirming, isSuccess: isReceiptSuccess } = useWaitForTransactionReceipt({
    hash: submittedTxHash,
    chainId,
    query: { enabled: Boolean(submittedTxHash) },
  })

  const handleConfirmed = useEvent(() => {
    // Optimistically mark the auction migrated so the CTA collapses immediately — data-api's
    // lbp_migration_tx_hash lags the chain by a few blocks, and this keeps the just-migrated
    // (in-session) view consistent with the post-refresh one.
    if (auctionDetails && submittedTxHash && !auctionDetails.lbpMigrationTxHash) {
      setAuctionDetails({ ...auctionDetails, lbpMigrationTxHash: submittedTxHash })
    }
    setSubmittedTxHash(undefined)
    setIsConfirmed(true)
    onTransactionConfirmed?.()
  })
  useEffect(() => {
    if (isReceiptSuccess && submittedTxHash) {
      handleConfirmed()
    }
  }, [isReceiptSuccess, submittedTxHash, handleConfirmed])

  const onSubmit = useEvent(async () => {
    const auction = assume0xAddress(auctionAddress)
    const strategy = assume0xAddress(lbpStrategyAddress)
    if (!auction || !strategy || !chainId) {
      return
    }
    setError(undefined)
    try {
      const switched = await selectChain(chainId)
      if (!switched) {
        setError(new Error('Failed to switch networks for the LBP migration'))
        return
      }
      const tx = buildMigrateTx({ lbpStrategyAddress: strategy, auctionAddress: auction })
      const hash = await sendTransactionAsync({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId,
      })
      setSubmittedTxHash(hash)
    } catch (e) {
      const submissionError = e instanceof Error ? e : new Error('Failed to submit migrate transaction')
      setError(submissionError)
      logger.error(submissionError, {
        tags: { file: 'useMigrateSubmit', function: 'onSubmit' },
        extra: { auctionAddress, lbpStrategyAddress, chainId },
      })
    }
  })

  return {
    onSubmit,
    isPending: isWaitingForWallet || isConfirming,
    isWaitingForWallet,
    isConfirmed,
    error,
  }
}

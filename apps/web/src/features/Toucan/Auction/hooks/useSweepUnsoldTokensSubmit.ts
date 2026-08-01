import { buildSweepUnsoldTokensTx } from '@uniswap/liquidity-launcher-sdk'
import { useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { useSelectChain } from '~/hooks/useSelectChain'
import { assume0xAddress } from '~/utils/wagmi'

export interface SweepUnsoldTokensSubmitState {
  onSubmit: () => Promise<void>
  // Waiting for the wallet signature or the transaction to confirm
  isPending: boolean
  // Wallet signature requested but not yet granted
  isWaitingForWallet: boolean
  error: Error | undefined
}

/**
 * Submits the creator's `sweepUnsoldTokens()` transaction. Mirrors the bidder withdraw submit
 * flow (chain switch -> wallet signature -> confirmation -> refetch), but the calldata is built
 * client-side with the SDK's buildSweepUnsoldTokensTx instead of a backend transaction endpoint —
 * the call takes no arguments, so there is nothing for a server to prepare.
 */
export function useSweepUnsoldTokensSubmit({
  onTransactionSubmitted,
  onTransactionConfirmed,
}: {
  onTransactionSubmitted?: () => void
  onTransactionConfirmed?: () => void
}): SweepUnsoldTokensSubmitState {
  const { auctionAddress, chainId } = useAuctionStore((state) => ({
    auctionAddress: state.auctionDetails?.address,
    chainId: state.auctionDetails?.chainId,
  }))
  const selectChain = useSelectChain()
  const { sendTransactionAsync, isPending: isWaitingForWallet } = useSendTransaction()
  const [submittedTxHash, setSubmittedTxHash] = useState<`0x${string}` | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: submittedTxHash,
    chainId,
    query: { enabled: Boolean(submittedTxHash) },
  })

  const handleConfirmed = useEvent(() => {
    setSubmittedTxHash(undefined)
    onTransactionConfirmed?.()
  })
  useEffect(() => {
    if (isConfirmed && submittedTxHash) {
      handleConfirmed()
    }
  }, [isConfirmed, submittedTxHash, handleConfirmed])

  const onSubmit = useEvent(async () => {
    const address = assume0xAddress(auctionAddress)
    if (!address || !chainId) {
      return
    }
    setError(undefined)
    try {
      const switched = await selectChain(chainId)
      if (!switched) {
        setError(new Error('Failed to switch networks for the creator sweep'))
        return
      }
      const tx = buildSweepUnsoldTokensTx({ auctionAddress: address })
      const hash = await sendTransactionAsync({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId,
      })
      setSubmittedTxHash(hash)
      onTransactionSubmitted?.()
    } catch (e) {
      const submissionError = e instanceof Error ? e : new Error('Failed to submit sweepUnsoldTokens transaction')
      setError(submissionError)
      logger.error(submissionError, {
        tags: { file: 'useSweepUnsoldTokensSubmit', function: 'onSubmit' },
        extra: { auctionAddress, chainId },
      })
    }
  })

  return {
    onSubmit,
    isPending: isWaitingForWallet || isConfirming,
    isWaitingForWallet,
    error,
  }
}

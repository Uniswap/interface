import type {
  ExitBidAndClaimTokensResponse,
  ExitBidPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { BidToExit, ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useExitBidAndClaimTokensMutation } from 'uniswap/src/data/rest/auctions/useExitBidAndClaimTokensMutation'
import { useExitBidPositionMutation } from 'uniswap/src/data/rest/auctions/useExitBidPositionMutation'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import type { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  ToucanWithdrawBidAndClaimTokensTransactionInfo,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import {
  isSignerMnemonicAccountDetails,
  SignerMnemonicAccountDetails,
} from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getAuctionWithdrawBaseAnalyticsProperties } from '~/components/Toucan/Auction/analytics'
import { AuctionBidStatus } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'

export interface PreparedWithdrawBidAndClaimTokensTransaction {
  txRequest: ValidatedTransactionRequest
  info: ToucanWithdrawBidAndClaimTokensTransactionInfo
  requestId: string
}

export interface WithdrawBidAndClaimTokensSubmitState {
  onSubmit: (prepared?: PreparedWithdrawBidAndClaimTokensTransaction) => Promise<void>
  prepareTransaction: () => Promise<PreparedWithdrawBidAndClaimTokensTransaction | undefined>
  isDisabled: boolean
  isPending: boolean
  onTransactionSubmitted?: () => void
  error?: Error
}

interface UseWithdrawBidAndClaimTokensFormSubmitParams {
  accountAddress: string | undefined
  auctionContractAddress: string | undefined
  chainId: number | undefined
  bidId?: string // Optional bidId - if provided, processes single bid; if not provided, processes all bids
  mode?: 'exit' | 'claim' // Mode determines the isExited flag: 'exit' = false (bid not yet exited), 'claim' = true (bid already exited)
  isPreClaimWindow?: boolean // If true and bidId is provided, use the simpler exitBidPosition API
  onTransactionSubmitted?: () => void
  // Function to trigger the withdraw and claim saga - will be passed in from component
  triggerWithdrawBidAndClaimTokens: (params: {
    account: SignerMnemonicAccountDetails
    chainId: number
    txRequest: ValidatedTransactionRequest
    info: ToucanWithdrawBidAndClaimTokensTransactionInfo
    setCurrentStep: SetCurrentStepFn
    onSuccess: (hash: string) => void
    onFailure: (error: Error) => void
    analytics?: Omit<UniverseEventProperties[AuctionEventName.AuctionWithdrawSubmitted], 'transaction_hash'>
  }) => void
  // Optional token data for display in activity toast and analytics
  withdrawalData?: {
    auctionTokenAddress?: string
    auctionTokenSymbol?: string
    auctionTokenAmountRaw?: string
    auctionTokenAmountUsd?: number
    bidTokenAddress?: string
    bidTokenSymbol?: string
    bidTokenAmountRaw?: string
    bidTokenAmountUsd?: number
    budgetTokenAmountRaw?: string
    budgetTokenAmountUsd?: number
    maxFdvUsd?: number
    expectedReceiveAmount?: number
  }
  // Auction status for analytics
  isGraduated?: boolean
  isAuctionCompleted?: boolean
}

interface UseWithdrawBidAndClaimTokensFormSubmitResult {
  submitState: WithdrawBidAndClaimTokensSubmitState
}

export function useWithdrawBidAndClaimTokensFormSubmit({
  accountAddress,
  auctionContractAddress,
  chainId,
  bidId,
  mode = 'exit',
  isPreClaimWindow = false,
  onTransactionSubmitted,
  triggerWithdrawBidAndClaimTokens,
  withdrawalData,
  isGraduated = false,
  isAuctionCompleted = false,
}: UseWithdrawBidAndClaimTokensFormSubmitParams): UseWithdrawBidAndClaimTokensFormSubmitResult {
  const exitBidAndClaimTokensMutation = useExitBidAndClaimTokensMutation()
  const exitBidPositionMutation = useExitBidPositionMutation()

  // Use exitBidPosition API when in pre-claim window with a single bid
  const useSimpleExitApi = isPreClaimWindow && !!bidId
  const { evmAccount } = useWallet()
  const trace = useTrace()
  const preparedTransactionRef = useRef<{
    signature: string
    data: PreparedWithdrawBidAndClaimTokensTransaction
  } | null>(null)
  const [submissionError, setSubmissionError] = useState<Error | undefined>(undefined)

  // Get user bids and actions from auction store
  const userBids = useAuctionStore((state) => state.userBids)
  const refetchUserBids = useAuctionStore((state) => state.refetchUserBids)
  const { addPendingWithdrawalBid, addAwaitingConfirmationBid } = useAuctionStoreActions()

  // Build the bids array for the API call
  // - If bidId is provided, process only that bid
  // - If no bidId, process all non-claimed bids
  // - isExited is determined by bid status or mode parameter
  // Note: Explicitly creating BidToExit instances to ensure proper protobuf serialization
  const bidsToProcess = useMemo(() => {
    if (bidId) {
      // Single bid mode - use the mode parameter to determine isExited
      const isExited = mode === 'claim'
      return [new BidToExit({ bidId, isExited })]
    }

    // All bids mode - filter out claimed bids and set isExited based on status
    return userBids
      .filter((bid) => bid.status !== AuctionBidStatus.Claimed)
      .map(
        (bid) =>
          new BidToExit({
            bidId: bid.bidId,
            // isExited: true if already exited (needs claiming), false if submitted (needs exiting)
            isExited: bid.status === AuctionBidStatus.Exited,
          }),
      )
  }, [bidId, mode, userBids])

  const setCurrentTransactionStep = useCallback(() => {}, [])

  const handleWithdrawBidAndClaimTokensSuccess = useEvent((hash: string) => {
    preparedTransactionRef.current = null
    exitBidAndClaimTokensMutation.reset()
    exitBidPositionMutation.reset()

    // Add the specific bid(s) being withdrawn to the per-bid tracking Sets
    // For pre-claim window single bid exit, only add the specific bidId
    if (useSimpleExitApi && bidId) {
      addPendingWithdrawalBid(bidId, hash)
      addAwaitingConfirmationBid(bidId)
    } else {
      for (const bidToExit of bidsToProcess) {
        addPendingWithdrawalBid(bidToExit.bidId, hash)
        addAwaitingConfirmationBid(bidToExit.bidId)
      }
    }

    // Immediately trigger a refetch to start detecting status changes
    refetchUserBids?.()
    onTransactionSubmitted?.()
  })

  const handleWithdrawBidAndClaimTokensFailure = useEvent((error: Error) => {
    preparedTransactionRef.current = null
    setSubmissionError(error)
    logger.error(error, {
      tags: { file: 'WithdrawBidAndClaimTokensFormSubmit', function: 'handleWithdrawBidAndClaimTokensFailure' },
      extra: { message: 'Failed to withdraw bid and claim tokens' },
    })
  })

  const prepareTransaction = useEvent(async (): Promise<PreparedWithdrawBidAndClaimTokensTransaction | undefined> => {
    if (!accountAddress || !auctionContractAddress || !chainId) {
      return undefined
    }

    // For pre-claim window single bid exit, we only need bidId
    // For batch operations, we need bidsToProcess
    if (!useSimpleExitApi && bidsToProcess.length === 0) {
      handleWithdrawBidAndClaimTokensFailure(new Error('No bids available to withdraw or claim'))
      return undefined
    }

    if (useSimpleExitApi && !bidId) {
      handleWithdrawBidAndClaimTokensFailure(new Error('No bid ID provided for pre-claim window exit'))
      return undefined
    }

    // Signature includes bidId, mode, bidsToProcess, and useSimpleExitApi to ensure different scenarios get different cached transactions
    const bidsSignature = useSimpleExitApi
      ? `preclaim:${bidId}`
      : bidsToProcess.map((b) => `${b.bidId}:${b.isExited}`).join(',')
    const signature = [
      chainId.toString(),
      accountAddress.toLowerCase(),
      auctionContractAddress.toLowerCase(),
      bidsSignature,
    ].join(':')

    if (preparedTransactionRef.current?.signature === signature) {
      return preparedTransactionRef.current.data
    }

    try {
      if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
        handleWithdrawBidAndClaimTokensFailure(new Error('Wallet is not connected with a signer account'))
        return undefined
      }

      let txRequest: ValidatedTransactionRequest | undefined
      let requestId: string

      // Use the simpler exitBidPosition API for pre-claim window single bid exit
      if (useSimpleExitApi && bidId) {
        const response: ExitBidPositionResponse = await exitBidPositionMutation.mutateAsync({
          bidId,
          auctionContractAddress: auctionContractAddress.toLowerCase(),
          chainId: chainId as ChainId,
          walletAddress: accountAddress,
        })

        if (!response.exitBid || !response.exitBid.to || !response.exitBid.data) {
          handleWithdrawBidAndClaimTokensFailure(new Error('Received incomplete transaction data'))
          return undefined
        }

        txRequest = validateTransactionRequest({
          to: response.exitBid.to,
          from: response.exitBid.from,
          data: response.exitBid.data,
          value: response.exitBid.value,
          chainId: response.exitBid.chainId,
        })
        requestId = response.requestId
      } else {
        // Use the batch exitBidAndClaimTokens API for normal operations
        const response: ExitBidAndClaimTokensResponse = await exitBidAndClaimTokensMutation.mutateAsync({
          bids: bidsToProcess,
          auctionContractAddress: auctionContractAddress.toLowerCase(),
          chainId: chainId as ChainId,
          walletAddress: accountAddress,
        })

        if (
          !response.exitBidAndClaimTokens ||
          !response.exitBidAndClaimTokens.to ||
          !response.exitBidAndClaimTokens.data
        ) {
          handleWithdrawBidAndClaimTokensFailure(new Error('Received incomplete transaction data'))
          return undefined
        }

        txRequest = validateTransactionRequest({
          to: response.exitBidAndClaimTokens.to,
          from: response.exitBidAndClaimTokens.from,
          data: response.exitBidAndClaimTokens.data,
          value: response.exitBidAndClaimTokens.value,
          chainId: response.exitBidAndClaimTokens.chainId,
        })
        requestId = response.requestId
      }

      if (!txRequest) {
        handleWithdrawBidAndClaimTokensFailure(
          new Error('Received invalid transaction request for Toucan exit and claim'),
        )
        return undefined
      }

      const info: ToucanWithdrawBidAndClaimTokensTransactionInfo = {
        type: TransactionType.ToucanWithdrawBidAndClaimTokens,
        auctionContractAddress: auctionContractAddress.toLowerCase(),
        auctionTokenAddress: withdrawalData?.auctionTokenAddress,
        auctionTokenAmountRaw: withdrawalData?.auctionTokenAmountRaw,
        bidTokenAddress: withdrawalData?.bidTokenAddress,
        bidTokenAmountRaw: withdrawalData?.bidTokenAmountRaw,
      }

      const preparedTransaction: PreparedWithdrawBidAndClaimTokensTransaction = {
        txRequest,
        info,
        requestId,
      }

      preparedTransactionRef.current = { signature, data: preparedTransaction }

      return preparedTransaction
    } catch (error) {
      handleWithdrawBidAndClaimTokensFailure(
        error instanceof Error ? error : new Error('Failed to prepare exit and claim transaction'),
      )
      return undefined
    }
  })

  const handleSubmit = useEvent(async (prepared?: PreparedWithdrawBidAndClaimTokensTransaction) => {
    setSubmissionError(undefined)

    const preparedTransaction = prepared ?? (await prepareTransaction())

    if (!preparedTransaction) {
      return undefined
    }

    if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
      handleWithdrawBidAndClaimTokensFailure(new Error('Wallet is not connected with a signer account'))
      return undefined
    }

    if (!chainId) {
      handleWithdrawBidAndClaimTokensFailure(new Error('Missing chain ID for Toucan withdraw submission'))
      return undefined
    }

    const analytics = getAuctionWithdrawBaseAnalyticsProperties({
      trace,
      chainId,
      info: preparedTransaction.info,
      auctionTokenSymbol: withdrawalData?.auctionTokenSymbol,
      bidTokenSymbol: withdrawalData?.bidTokenSymbol,
      auctionTokenAmountUsd: withdrawalData?.auctionTokenAmountUsd,
      bidTokenAmountUsd: withdrawalData?.bidTokenAmountUsd,
      budgetTokenAmountRaw: withdrawalData?.budgetTokenAmountRaw,
      budgetTokenAmountUsd: withdrawalData?.budgetTokenAmountUsd,
      maxFdvUsd: withdrawalData?.maxFdvUsd,
      expectedReceiveAmount: withdrawalData?.expectedReceiveAmount,
      isGraduated,
      isAuctionCompleted,
    })

    return new Promise<void>((resolve, reject) => {
      triggerWithdrawBidAndClaimTokens({
        account: evmAccount,
        chainId,
        txRequest: preparedTransaction.txRequest,
        info: preparedTransaction.info,
        setCurrentStep: setCurrentTransactionStep,
        onSuccess: (hash: string) => {
          handleWithdrawBidAndClaimTokensSuccess(hash)
          resolve()
        },
        onFailure: (error: Error) => {
          handleWithdrawBidAndClaimTokensFailure(error)
          reject(error)
        },
        analytics,
      })
    })
  })

  // For pre-claim window single bid exit, we only need bidId, not bidsToProcess
  const hasBidsToProcess = useSimpleExitApi ? !!bidId : bidsToProcess.length > 0
  const isAnyMutationPending = exitBidAndClaimTokensMutation.isPending || exitBidPositionMutation.isPending

  const isSubmitDisabled =
    !chainId || !auctionContractAddress || !accountAddress || !hasBidsToProcess || isAnyMutationPending

  const isPending = isAnyMutationPending

  return {
    submitState: {
      onSubmit: handleSubmit,
      prepareTransaction,
      isDisabled: isSubmitDisabled,
      isPending,
      onTransactionSubmitted,
      error: submissionError,
    },
  }
}

import { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useRef, useState } from 'react'
import { useSubmitBidMutation } from 'uniswap/src/data/rest/auctions/useSubmitBidMutation'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { validateTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import { ToucanBidTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { isValidHexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { zeroAddress } from 'viem'
import { getAuctionBidBaseAnalyticsProperties } from '~/components/Toucan/Auction/analytics'
import { BidInfoTab } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { useToucanSubmitBid } from '~/hooks/useToucanSubmitBid'

export interface PreparedBidTransaction {
  txRequest: ValidatedTransactionRequest
  info: ToucanBidTransactionInfo
  requestId: string
}

export interface SubmitBidOptions {
  preBidSteps?: TransactionStep[]
  setSteps?: (steps: TransactionStep[]) => void
  setCurrentStep?: SetCurrentStepFn
  /**
   * Optional callback to run after pre-bid steps complete but before actual bid submission.
   * Used for post-permit2 simulation to validate bid against latest clearing price.
   * If this returns false, the bid submission is aborted.
   */
  onPreBidStepsComplete?: () => Promise<boolean>
}

export interface SubmitState {
  onSubmit: (prepared?: PreparedBidTransaction, options?: SubmitBidOptions) => Promise<void>
  prepareTransaction: () => Promise<PreparedBidTransaction | undefined>
  isDisabled: boolean
  isPending: boolean
  onTransactionSubmitted?: () => void
  error?: Error
  clearError: () => void
}

interface UseBidFormSubmitParams {
  evaluateMaxPrice: (options?: { shouldAutoCorrectMin?: boolean }) => {
    sanitizedQ96?: bigint
    sanitizedDisplayValue?: string
    error?: string
  }
  exactMaxValuationAmount: string
  setExactMaxValuationAmount: (amount: string) => void
  setMaxPriceError: (error: string | undefined) => void
  budgetCurrencyAmount: CurrencyAmount<Currency> | undefined
  accountAddress: string | undefined
  auctionContractAddress: string | undefined
  chainId: number | undefined
  isNativeBidToken: boolean
  currency: string | undefined
  resetBudgetField: () => void
  resetMaxValuationField: () => void
  // Validation flags
  budgetAmountIsZero: boolean
  maxPriceAmountIsZero: boolean
  exceedsBalance: boolean
  isMaxPriceBelowMinimum: boolean
  bidTokenDecimals: number | undefined
  maxPriceQ96: bigint | undefined
  onTransactionSubmitted?: () => void
  // Analytics parameters
  budgetAmountUsd?: number
  maxFdvUsd?: number
  pricePerToken?: number
  expectedReceiveAmount?: number
  minExpectedReceiveAmount?: number
  maxReceivableAmount?: number
  auctionTokenSymbol?: string
  auctionTokenName?: string
}

interface UseBidFormSubmitResult {
  submitState: SubmitState
}

export function useBidFormSubmit({
  evaluateMaxPrice,
  exactMaxValuationAmount,
  setExactMaxValuationAmount,
  setMaxPriceError,
  budgetCurrencyAmount,
  accountAddress,
  auctionContractAddress,
  chainId,
  isNativeBidToken,
  currency,
  resetBudgetField,
  resetMaxValuationField,
  budgetAmountIsZero,
  maxPriceAmountIsZero,
  exceedsBalance,
  isMaxPriceBelowMinimum,
  bidTokenDecimals,
  maxPriceQ96,
  onTransactionSubmitted,
  budgetAmountUsd,
  maxFdvUsd,
  pricePerToken,
  expectedReceiveAmount,
  minExpectedReceiveAmount,
  maxReceivableAmount,
  auctionTokenSymbol,
  auctionTokenName,
}: UseBidFormSubmitParams): UseBidFormSubmitResult {
  const submitBidMutation = useSubmitBidMutation()
  const toucanSubmitBid = useToucanSubmitBid()
  const { evmAccount } = useWallet()
  const trace = useTrace()
  const preparedBidRef = useRef<{ signature: string; data: PreparedBidTransaction } | null>(null)
  const [submissionError, setSubmissionError] = useState<Error | undefined>(undefined)

  // Store actions for optimistic bid management
  const { setOptimisticBid, setPreviousBidsCount, setActiveBidFormTab } = useAuctionStoreActions()
  const currentBidsCount = useAuctionStore((state) => state.userBids.length)

  const setCurrentTransactionStep = useCallback(() => {}, [])

  const resetForm = useEvent(() => {
    resetBudgetField()
    resetMaxValuationField()
  })

  const handleBidSubmitSuccess = useEvent((hash: string) => {
    // Capture values before resetForm() clears them
    if (maxPriceQ96 && budgetCurrencyAmount && bidTokenDecimals !== undefined) {
      const optimisticBid = {
        maxPriceQ96: maxPriceQ96.toString(),
        budgetRaw: budgetCurrencyAmount.quotient.toString(),
        bidTokenDecimals,
        bidTokenSymbol: budgetCurrencyAmount.currency.symbol ?? '',
        submittedAt: Date.now(),
        txHash: hash,
      }

      // Store previous count for detection when API returns new bid
      setPreviousBidsCount(currentBidsCount)

      // Set optimistic bid and switch to MY_BIDS tab
      setOptimisticBid(optimisticBid)
      setActiveBidFormTab(BidInfoTab.MY_BIDS)
    }

    preparedBidRef.current = null
    resetForm()
    submitBidMutation.reset()
    onTransactionSubmitted?.()
  })

  const handleBidSubmitFailure = useEvent((error: Error) => {
    // Clear optimistic bid on failure
    setOptimisticBid(null)

    // Don't show popup here - the transaction popup will handle failures automatically
    // For user rejections, no popup should be shown at all
    preparedBidRef.current = null
    setSubmissionError(error)
    logger.error(error, {
      tags: { file: 'BidFormSubmit', function: 'handleBidSubmitFailure' },
      extra: { message: 'Failed to submit bid' },
    })
  })

  const prepareTransaction = useEvent(async (): Promise<PreparedBidTransaction | undefined> => {
    const { sanitizedQ96, sanitizedDisplayValue, error } = evaluateMaxPrice({ shouldAutoCorrectMin: true })

    if (error) {
      setMaxPriceError(error)
      return undefined
    }

    if (!sanitizedQ96 || !budgetCurrencyAmount || !accountAddress || !auctionContractAddress || !chainId) {
      return undefined
    }

    const amountRaw = BigInt(budgetCurrencyAmount.quotient.toString())
    if (amountRaw === 0n) {
      return undefined
    }

    if (sanitizedDisplayValue && sanitizedDisplayValue !== exactMaxValuationAmount) {
      setExactMaxValuationAmount(sanitizedDisplayValue)
    }

    setMaxPriceError(undefined)

    const signature = [
      amountRaw.toString(),
      sanitizedQ96.toString(),
      chainId.toString(),
      accountAddress.toLowerCase(),
      auctionContractAddress.toLowerCase(),
      (currency ?? zeroAddress).toLowerCase(),
      isNativeBidToken ? '1' : '0',
    ].join(':')

    if (preparedBidRef.current?.signature === signature) {
      return preparedBidRef.current.data
    }

    try {
      const response = await submitBidMutation.mutateAsync({
        maxPrice: sanitizedQ96.toString(),
        amount: amountRaw.toString(),
        walletAddress: accountAddress,
        auctionContractAddress: auctionContractAddress.toLowerCase(),
        chainId: chainId as ChainId,
      })

      if (!response.bid || !response.bid.data || !response.bid.to) {
        handleBidSubmitFailure(new Error('Received incomplete bid response'))
        return undefined
      }

      const bidCalldata = response.bid.data
      const requestId = response.requestId
      const currencyLower = (currency ?? zeroAddress).toLowerCase()

      if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
        handleBidSubmitFailure(new Error('Wallet is not connected with a signer account'))
        return undefined
      }

      const nativeValue = (() => {
        if (isNativeBidToken) {
          const valueAsBigInt = BigInt(amountRaw.toString())
          return `0x${valueAsBigInt.toString(16)}`
        }
        return '0x0'
      })()

      if (!isValidHexString(bidCalldata)) {
        handleBidSubmitFailure(new Error('Invalid calldata format'))
        return undefined
      }

      const txRequest = validateTransactionRequest({
        to: auctionContractAddress,
        from: evmAccount.address,
        data: bidCalldata,
        value: nativeValue,
        chainId,
      })

      if (!txRequest) {
        handleBidSubmitFailure(new Error('Received invalid transaction request for Toucan bid'))
        return undefined
      }

      const info: ToucanBidTransactionInfo = {
        type: TransactionType.ToucanBid,
        amountRaw: amountRaw.toString(),
        maxPriceQ96: sanitizedQ96.toString(),
        auctionContractAddress: auctionContractAddress.toLowerCase(),
        bidTokenAddress: currencyLower,
        requestId,
        dappInfo: {
          name: 'Uniswap CCA',
          icon: 'https://protocol-icons.s3.amazonaws.com/icons/uniswap-v4.jpg',
        },
      }

      const preparedBid: PreparedBidTransaction = {
        txRequest,
        info,
        requestId,
      }

      preparedBidRef.current = { signature, data: preparedBid }
      return preparedBid
    } catch (error) {
      handleBidSubmitFailure(error instanceof Error ? error : new Error('Failed to submit bid'))
      return undefined
    }
  })

  const handleSubmit = useEvent(async (prepared?: PreparedBidTransaction, options?: SubmitBidOptions) => {
    // Clear any previous errors when starting a new submission
    setSubmissionError(undefined)

    const preparedBid = prepared ?? (await prepareTransaction())

    if (!preparedBid) {
      return undefined
    }

    if (!evmAccount || !isSignerMnemonicAccountDetails(evmAccount)) {
      handleBidSubmitFailure(new Error('Wallet is not connected with a signer account'))
      return undefined
    }

    if (!chainId) {
      handleBidSubmitFailure(new Error('Missing chain ID for Toucan bid submission'))
      return undefined
    }

    const analytics = getAuctionBidBaseAnalyticsProperties({
      trace,
      chainId,
      info: preparedBid.info,
      bidTokenAmountUsd: budgetAmountUsd,
      maxFdvUsd,
      pricePerToken,
      minExpectedReceiveAmount,
      maxReceivableAmount,
      tokenSymbol: auctionTokenSymbol,
      tokenName: auctionTokenName,
    })

    // Return a promise that resolves/rejects when the saga completes
    // This allows callers to await the full submission flow
    return new Promise<void>((resolve, reject) => {
      toucanSubmitBid({
        account: evmAccount,
        chainId,
        txRequest: preparedBid.txRequest,
        info: preparedBid.info,
        setCurrentStep: options?.setCurrentStep ?? setCurrentTransactionStep,
        setSteps: options?.setSteps,
        preBidSteps: options?.preBidSteps,
        analytics,
        onPreBidStepsComplete: options?.onPreBidStepsComplete,
        onSuccess: (hash: string) => {
          handleBidSubmitSuccess(hash)
          resolve()
        },
        onFailure: (error: Error) => {
          handleBidSubmitFailure(error)
          reject(error)
        },
      })
    })
  })

  const isSubmitDisabled =
    !chainId ||
    !auctionContractAddress ||
    !accountAddress ||
    bidTokenDecimals === undefined ||
    budgetAmountIsZero ||
    maxPriceAmountIsZero ||
    exceedsBalance ||
    isMaxPriceBelowMinimum ||
    submitBidMutation.isPending ||
    !maxPriceQ96

  return {
    submitState: {
      onSubmit: handleSubmit,
      prepareTransaction,
      isDisabled: isSubmitDisabled,
      isPending: submitBidMutation.isPending,
      onTransactionSubmitted,
      error: submissionError,
      clearError: () => setSubmissionError(undefined),
    },
  }
}

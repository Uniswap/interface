import { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { useCallback, useRef, useState } from 'react'
import { useSubmitBidMutation } from 'uniswap/src/data/rest/auctions/useSubmitBidMutation'
import { logger } from 'utilities/src/logger/logger'
import { PreparedBidTransaction } from '~/components/Toucan/Auction/hooks/useBidFormSubmit'

export enum BidSimulationErrorType {
  BELOW_CLEARING_PRICE = 'BELOW_CLEARING_PRICE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

interface BidSimulationError {
  type: BidSimulationErrorType
  message: string
  minBidDisplay?: string // For "set minimum bid" action
}

interface UseBidSimulationParams {
  preparedBid: PreparedBidTransaction | undefined
  chainId: number | undefined
  accountAddress: string | undefined
  auctionContractAddress: string | undefined
  minValidBidDisplay: string | undefined
  onSetMinBid: ((minBidDisplay: string) => void) | undefined
  onCloseModal: () => void
  /** Callback to refresh checkpoint data on simulation error */
  onRefreshCheckpoint?: () => Promise<void>
}

interface UseBidSimulationResult {
  simulationError: BidSimulationError | undefined
  isSimulating: boolean
  simulate: () => Promise<boolean>
  retryWithMinBid: () => void
  clearSimulationError: () => void
}

/**
 * Parse error response to determine if it's a "below clearing price" error.
 * The API returns HTTP 400/500 when the bid price is below the minimum threshold.
 */
function parseBidSimulationError(error: unknown, minBidDisplay: string | undefined): BidSimulationError {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const lowerMessage = errorMessage.toLowerCase()

  // Check for clearing price related errors using specific multi-word phrases
  // to avoid false positives from generic terms
  if (
    lowerMessage.includes('price too low') ||
    lowerMessage.includes('below clearing') ||
    lowerMessage.includes('below minimum') ||
    lowerMessage.includes('minimum bid') ||
    lowerMessage.includes('bid rejected') ||
    lowerMessage.includes('invalid bid') ||
    lowerMessage.includes('clearing price') ||
    lowerMessage.includes('bid too low')
  ) {
    return {
      type: BidSimulationErrorType.BELOW_CLEARING_PRICE,
      message: errorMessage,
      minBidDisplay,
    }
  }

  // Check for network-related errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('connection failed') ||
    lowerMessage.includes('failed to fetch')
  ) {
    return {
      type: BidSimulationErrorType.NETWORK_ERROR,
      message: errorMessage,
    }
  }

  return {
    type: BidSimulationErrorType.UNKNOWN,
    message: errorMessage,
  }
}

/**
 * Hook for running bid simulations before actual submission.
 * Simulations validate the bid against the current clearing price without
 * actually submitting the transaction.
 *
 * Use cases:
 * 1. Pre-permit2 simulation (native tokens or already approved)
 * 2. Post-permit2 simulation (after permit2 steps complete)
 */
export function useBidSimulation({
  preparedBid,
  chainId,
  accountAddress,
  auctionContractAddress,
  minValidBidDisplay,
  onSetMinBid,
  onCloseModal,
  onRefreshCheckpoint,
}: UseBidSimulationParams): UseBidSimulationResult {
  const submitBidMutation = useSubmitBidMutation()
  const [simulationError, setSimulationError] = useState<BidSimulationError | undefined>()
  const [isSimulating, setIsSimulating] = useState(false)
  // Tracks whether simulation was aborted (e.g., modal closed or error cleared)
  const isAbortedRef = useRef(false)

  const simulate = useCallback(async (): Promise<boolean> => {
    if (!preparedBid || !chainId || !accountAddress || !auctionContractAddress) {
      return false
    }

    isAbortedRef.current = false
    setIsSimulating(true)
    setSimulationError(undefined)

    try {
      await submitBidMutation.mutateAsync({
        maxPrice: preparedBid.info.maxPriceQ96,
        amount: preparedBid.info.amountRaw,
        walletAddress: accountAddress,
        auctionContractAddress: auctionContractAddress.toLowerCase(),
        chainId: chainId as ChainId,
        // TODO | Toucan -- determine why this is returning error with true set
        simulateTransaction: false,
      })

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref may be set during await
      if (isAbortedRef.current) {
        return false
      }

      setIsSimulating(false)
      return true
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- ref may be set during await
      if (isAbortedRef.current) {
        return false
      }

      logger.warn('useBidSimulation', 'simulate', 'Simulation failed', {
        error: error instanceof Error ? error.message : String(error),
        maxPriceQ96: preparedBid.info.maxPriceQ96,
        amountRaw: preparedBid.info.amountRaw,
      })

      const parsedError = parseBidSimulationError(error, minValidBidDisplay)
      setSimulationError(parsedError)
      setIsSimulating(false)

      // Refresh checkpoint data on error to get latest clearing price
      if (onRefreshCheckpoint) {
        onRefreshCheckpoint()
      }

      return false
    }
  }, [
    preparedBid,
    chainId,
    accountAddress,
    auctionContractAddress,
    minValidBidDisplay,
    submitBidMutation,
    onRefreshCheckpoint,
  ])

  const retryWithMinBid = useCallback(() => {
    if (minValidBidDisplay && onSetMinBid) {
      // Close the modal first
      onCloseModal()
      // Update the form with the minimum valid bid
      onSetMinBid(minValidBidDisplay)
    }
  }, [minValidBidDisplay, onCloseModal, onSetMinBid])

  const clearSimulationError = useCallback(() => {
    isAbortedRef.current = true
    setSimulationError(undefined)
    setIsSimulating(false)
  }, [])

  return {
    simulationError,
    isSimulating,
    simulate,
    retryWithMinBid,
    clearSimulationError,
  }
}

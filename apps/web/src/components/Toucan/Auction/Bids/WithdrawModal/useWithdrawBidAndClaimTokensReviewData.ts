import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFormattedGasFee } from '~/components/Toucan/Auction/hooks/useFormattedGasFee'
import {
  PreparedWithdrawBidAndClaimTokensTransaction,
  WithdrawBidAndClaimTokensSubmitState,
} from '~/components/Toucan/Auction/hooks/useWithdrawBidAndClaimTokensFormSubmit'
import { useTransactionGasFee } from '~/hooks/useTransactionGasFee'

interface UseWithdrawBidAndClaimTokensReviewDataParams {
  isOpen: boolean
  submitState: WithdrawBidAndClaimTokensSubmitState
  auctionChainId: number | undefined
}

interface WithdrawBidAndClaimTokensReviewData {
  preparedWithdrawBidAndClaimTokens: PreparedWithdrawBidAndClaimTokensTransaction | undefined
  isPreparing: boolean
  preparationError: Error | undefined
  gasFeeCurrencyAmount: CurrencyAmount<Currency> | undefined
  formattedGasFee: string | undefined
  isGasFree: boolean
  isConfirmDisabled: boolean
  retryPreparation: () => void
}

export function useWithdrawBidAndClaimTokensReviewData({
  isOpen,
  submitState,
  auctionChainId,
}: UseWithdrawBidAndClaimTokensReviewDataParams): WithdrawBidAndClaimTokensReviewData {
  const [preparedWithdrawBidAndClaimTokens, setPreparedWithdrawBidAndClaimTokens] = useState<
    PreparedWithdrawBidAndClaimTokensTransaction | undefined
  >()
  const [isPreparing, setIsPreparing] = useState(false)
  const [preparationError, setPreparationError] = useState<Error | undefined>()
  const [retryTrigger, setRetryTrigger] = useState(0)

  // Validate chainId is present
  const normalizedChainId = useMemo(() => {
    if (!auctionChainId) {
      return undefined
    }
    return auctionChainId as UniverseChainId
  }, [auctionChainId])

  // Fallback to mainnet for hook call since hooks can't be conditional
  const nativeCurrencyInfo = useNativeCurrencyInfo(normalizedChainId ?? UniverseChainId.Mainnet)

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPreparedWithdrawBidAndClaimTokens(undefined)
      setPreparationError(undefined)
      setIsPreparing(false)
    }
  }, [isOpen])

  // Prepare transaction when modal opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryTrigger is intentionally included, submitState excluded
  useEffect(() => {
    let cancelled = false

    if (!isOpen || submitState.isDisabled) {
      return () => {
        cancelled = true
      }
    }

    setIsPreparing(true)

    ;(async () => {
      try {
        const result = await submitState.prepareTransaction()
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          if (!result) {
            setPreparedWithdrawBidAndClaimTokens(undefined)
            setPreparationError(new Error('Failed to prepare withdraw and claim'))
          } else {
            setPreparedWithdrawBidAndClaimTokens(result)
            setPreparationError(undefined)
          }
        }
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setPreparedWithdrawBidAndClaimTokens(undefined)
          setPreparationError(error instanceof Error ? error : new Error('Failed to prepare withdraw and claim'))
        }
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!cancelled) {
          setIsPreparing(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOpen, retryTrigger])

  // Calculate gas fee
  const gasFee = useTransactionGasFee(preparedWithdrawBidAndClaimTokens?.txRequest)
  const gasFeeCurrencyAmount = useMemo(() => {
    if (!preparedWithdrawBidAndClaimTokens || !gasFee.value || !nativeCurrencyInfo?.currency || !normalizedChainId) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(nativeCurrencyInfo.currency, gasFee.value)
  }, [gasFee.value, nativeCurrencyInfo?.currency, normalizedChainId, preparedWithdrawBidAndClaimTokens])

  const { formattedGasFee } = useFormattedGasFee({ gasFeeCurrencyAmount })

  const isGasFree = !gasFee.value || gasFee.value === '0'

  const retryPreparation = useCallback(() => {
    setPreparationError(undefined)
    setRetryTrigger((prev) => prev + 1)
  }, [])

  const isConfirmDisabled =
    !normalizedChainId ||
    submitState.isDisabled ||
    !preparedWithdrawBidAndClaimTokens ||
    isPreparing ||
    submitState.isPending ||
    Boolean(preparationError)

  return {
    preparedWithdrawBidAndClaimTokens,
    isPreparing,
    preparationError,
    gasFeeCurrencyAmount,
    formattedGasFee,
    isGasFree,
    isConfirmDisabled,
    retryPreparation,
  }
}

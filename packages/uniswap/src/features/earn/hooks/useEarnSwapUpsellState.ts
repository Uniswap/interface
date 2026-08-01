import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectEarnSwapUpsellTokenHistory } from 'uniswap/src/features/behaviorHistory/earn/selectors'
import {
  shouldShowEarnSwapUpsell,
  type EarnSwapUpsellTokenHistory,
} from 'uniswap/src/features/behaviorHistory/earn/swapUpsell'
import {
  permanentlyDismissEarnSwapUpsell,
  recordEarnSwapUpsellInteraction,
  recordEarnSwapUpsellQualifyingSwap,
} from 'uniswap/src/features/behaviorHistory/slice'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { EarnPositionStatus, useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { getValidEarnSwapUpsellCurrencyId } from 'uniswap/src/features/earn/swapUpsell'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance, selectEarnVaultForToken } from 'uniswap/src/features/earn/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const EARN_SWAP_UPSELL_POSITION_LOOKUP_TIMEOUT_MS = 10 * ONE_SECOND_MS

interface UseEarnSwapUpsellStateParams {
  outputCurrencyId: string
  transactionId: string
  walletAddress: string | undefined
  onDismiss: () => void
}

interface UseEarnSwapUpsellStateResult {
  vault: EarnVaultInfo | undefined
  currencyInfo: Maybe<CurrencyInfo>
  shouldRenderToast: boolean
  recordInteraction: () => void
}

/** Shared controller for the Earn swap-upsell toast. */
export function useEarnSwapUpsellState({
  outputCurrencyId,
  transactionId,
  walletAddress,
  onDismiss,
}: UseEarnSwapUpsellStateParams): UseEarnSwapUpsellStateResult {
  const dispatch = useDispatch()
  const isEarnEnabled = useIsEarnEnabled()
  const tokenCurrencyId = getValidEarnSwapUpsellCurrencyId(outputCurrencyId)
  const tokenHistory = useSelector((state: UniswapState) =>
    tokenCurrencyId ? selectEarnSwapUpsellTokenHistory(state, tokenCurrencyId) : undefined,
  )
  const isPermanentlyDismissed = tokenHistory?.permanentlyDismissed === true
  // Permanently dismissed or unsupported tokens never need vault/position lookups.
  const shouldResolve = isEarnEnabled && !!walletAddress && !isPermanentlyDismissed && tokenCurrencyId !== undefined

  const { isLoading, vault } = useEarnSwapUpsellVault({
    enabled: shouldResolve,
    outputCurrencyId: tokenCurrencyId ?? outputCurrencyId,
  })
  const currencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const { position, positionStatus } = useEarnPosition({
    vault,
    walletAddress,
    isConnected: !!walletAddress,
    enabled: shouldResolve && !!vault,
  })

  const hasCountedTransaction = tokenHistory?.countedTransactionIds?.[transactionId] === true
  // Evaluate display rules as if this swap were already recorded.
  const displayHistory = useMemo(
    () =>
      getEarnSwapUpsellDisplayHistory({
        hasCountedTransaction,
        tokenHistory,
        transactionId,
      }),
    [hasCountedTransaction, tokenHistory, transactionId],
  )
  // Freeze the clock for this short-lived toast.
  const [mountedAtMs] = useState(() => Date.now())
  const shouldShow = shouldShowEarnSwapUpsell({
    history: displayHistory,
    nowMs: mountedAtMs,
  })
  const hasActivePosition = hasConfirmedEarnPositionRawBalance(position)
  // Errored position lookups are unknown; timeout dismisses them without counting.
  const hasResolvedQualifyingSwap =
    shouldResolve &&
    !!vault &&
    (positionStatus === EarnPositionStatus.NoPosition ||
      (positionStatus === EarnPositionStatus.Present && !hasActivePosition))
  const shouldRenderToast = hasResolvedQualifyingSwap && shouldShow
  const isPositionLookupUnresolved =
    positionStatus === EarnPositionStatus.Loading || positionStatus === EarnPositionStatus.Error

  useEffect(() => {
    if (!shouldResolve || (!isLoading && !vault)) {
      onDismiss()
    }
  }, [isLoading, onDismiss, shouldResolve, vault])

  useEffect(() => {
    if (!shouldResolve) {
      return undefined
    }

    const isVaultLookupLoading = isLoading && !vault
    const isPositionLookupStalled = !!vault && isPositionLookupUnresolved
    if (!isVaultLookupLoading && !isPositionLookupStalled) {
      return undefined
    }

    // Do not let unresolved lookups head-block popup/notification queues.
    const timeout = setTimeout(onDismiss, EARN_SWAP_UPSELL_POSITION_LOOKUP_TIMEOUT_MS)
    return (): void => clearTimeout(timeout)
  }, [isLoading, isPositionLookupUnresolved, onDismiss, shouldResolve, vault])

  useEffect(() => {
    if (!tokenCurrencyId || !hasResolvedQualifyingSwap || hasCountedTransaction) {
      return
    }

    dispatch(
      recordEarnSwapUpsellQualifyingSwap({
        tokenCurrencyId,
        transactionId,
      }),
    )
  }, [dispatch, hasCountedTransaction, hasResolvedQualifyingSwap, tokenCurrencyId, transactionId])

  useEffect(() => {
    if (!tokenCurrencyId || !vault || !hasActivePosition) {
      return
    }

    dispatch(permanentlyDismissEarnSwapUpsell({ tokenCurrencyId }))
    onDismiss()
  }, [dispatch, hasActivePosition, onDismiss, tokenCurrencyId, vault])

  useEffect(() => {
    if (!vault || hasActivePosition || isPositionLookupUnresolved || shouldRenderToast) {
      return
    }

    onDismiss()
  }, [hasActivePosition, isPositionLookupUnresolved, onDismiss, shouldRenderToast, vault])

  const recordInteraction = useCallback(() => {
    if (!tokenCurrencyId) {
      return
    }

    dispatch(
      recordEarnSwapUpsellInteraction({
        tokenCurrencyId,
        timestampMs: Date.now(),
      }),
    )
  }, [dispatch, tokenCurrencyId])

  return {
    vault,
    currencyInfo,
    shouldRenderToast,
    recordInteraction,
  }
}

function getEarnSwapUpsellDisplayHistory({
  hasCountedTransaction,
  tokenHistory,
  transactionId,
}: {
  hasCountedTransaction: boolean
  tokenHistory: EarnSwapUpsellTokenHistory | undefined
  transactionId: string
}): EarnSwapUpsellTokenHistory | undefined {
  if (hasCountedTransaction) {
    return tokenHistory
  }

  return {
    ...tokenHistory,
    countedTransactionIds: {
      ...tokenHistory?.countedTransactionIds,
      [transactionId]: true,
    },
    qualifyingSwapCount: (tokenHistory?.qualifyingSwapCount ?? 0) + 1,
  }
}

function useEarnSwapUpsellVault({ enabled, outputCurrencyId }: { enabled: boolean; outputCurrencyId: string }): {
  isLoading: boolean
  vault: EarnVaultInfo | undefined
} {
  const hasValidOutputCurrencyId = Boolean(currencyIdToChain(outputCurrencyId))
  const shouldFetch = enabled && hasValidOutputCurrencyId
  const tokenProjectIds = useMemo(() => (shouldFetch ? [outputCurrencyId] : []), [outputCurrencyId, shouldFetch])
  const tokenProjects = useTokenProjects(tokenProjectIds)
  const { isLoadingVaults, vaults } = useEarnVaults({ enabled: shouldFetch })

  const tokenCurrencyIds = useMemo(() => {
    const ids = new Set<string>()
    if (hasValidOutputCurrencyId) {
      ids.add(outputCurrencyId)
    }
    tokenProjects.data?.forEach((info) => ids.add(info.currencyId))
    return Array.from(ids)
  }, [hasValidOutputCurrencyId, outputCurrencyId, tokenProjects.data])

  const vault = useMemo(() => selectEarnVaultForToken({ tokenCurrencyIds, vaults }), [tokenCurrencyIds, vaults])

  return {
    isLoading: shouldFetch && (isLoadingVaults || tokenProjects.loading),
    vault,
  }
}

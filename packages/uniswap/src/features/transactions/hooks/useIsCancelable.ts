import { TradingApi } from '@universe/api'
import { useEffect, useState } from 'react'
import { useActiveConnector } from 'uniswap/src/features/accounts/store/hooks'
import { AccessPattern } from 'uniswap/src/features/accounts/store/types/Connector'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  isBridge,
  isChained,
  isClassic,
  isUniswapX,
  isWrap,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  PlanTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// For L2 chains, delay showing cancel option by 2 seconds
const L2_CANCEL_DELAY_MS = 2 * ONE_SECOND_MS

export interface CancelableStepInfo {
  step: TransactionDetails
  stepIndex: number
  cancellationType: 'classic' | 'uniswapx'
  // For UniswapX steps, the orderId is extracted from step.hash (not a separate field)
  orderId?: string
  routing?: TradingApi.Routing
}

/**
 * Finds the cancelable step in a plan.
 *
 * Plan steps in `stepDetails` are TransactionDetails objects, NOT TradingApi.PlanStep objects.
 * They have `routing` (not `stepType`) and `hash` (which contains orderId for UniswapX steps).
 *
 * A step is cancelable if:
 * - For classic/bridge/wrap/unwrap: has hash (txHash), status is Pending
 * - For UniswapX: has hash (contains orderId), status is Pending
 */
export function findCancelableStepInPlan(typeInfo: PlanTransactionInfo): CancelableStepInfo | undefined {
  for (let i = 0; i < typeInfo.stepDetails.length; i++) {
    const step = typeInfo.stepDetails[i]
    if (!step) {
      continue
    }

    // Skip steps that aren't pending or don't have a hash
    if (step.status !== TransactionStatus.Pending || !step.hash) {
      continue
    }

    // Check for classic/bridge/wrap/unwrap transaction step
    // These steps have routing: CLASSIC, BRIDGE, WRAP, or UNWRAP
    // Note: isWrap() returns true for BOTH WRAP and UNWRAP routing types
    // All are standard on-chain transactions that can be cancelled via nonce replacement
    if (isClassic(step) || isBridge(step) || isWrap(step)) {
      return {
        step,
        stepIndex: i,
        cancellationType: 'classic',
      }
    }

    // Check for UniswapX order step
    // These steps have routing: DUTCH_V2, DUTCH_V3, DUTCH_LIMIT, or PRIORITY
    // For UniswapX steps, `step.hash` contains the orderId (not a tx hash)
    if (isUniswapX(step)) {
      return {
        step,
        stepIndex: i,
        cancellationType: 'uniswapx',
        orderId: step.hash, // For UniswapX plan steps, hash contains the orderId
        routing: step.routing,
      }
    }
  }

  return undefined
}

export function useIsCancelable(tx: TransactionDetails): boolean {
  const shouldDelayCancel = isL2ChainId(tx.chainId)
  const [hasDelayPassed, setHasDelayPassed] = useState(
    shouldDelayCancel ? Date.now() - tx.addedTime > L2_CANCEL_DELAY_MS : true,
  )

  // Force re-render when delay has passed for L2 chains
  useEffect(() => {
    if (shouldDelayCancel && !hasDelayPassed) {
      const timeRemaining = L2_CANCEL_DELAY_MS - (Date.now() - tx.addedTime)
      if (timeRemaining > 0) {
        const timeout = setTimeout(() => {
          setHasDelayPassed(true)
        }, timeRemaining)
        return () => clearTimeout(timeout)
      }
    }
    return undefined
  }, [shouldDelayCancel, hasDelayPassed, tx.addedTime])

  const connector = useActiveConnector(Platform.EVM)
  const isNativeAccess = connector?.access === AccessPattern.Native

  const isPlan = tx.typeInfo.type === TransactionType.Plan

  // For plans, check if there's a cancelable step
  if (isPlan) {
    const cancelableStep = findCancelableStepInPlan(tx.typeInfo as PlanTransactionInfo)
    if (!isNativeAccess) {
      return cancelableStep?.cancellationType === 'uniswapx' && hasDelayPassed
    }
    return cancelableStep !== undefined && hasDelayPassed
  }

  // Non-plan logic
  const isSentBridge = isBridge(tx) && tx.sendConfirmed
  const isPending = tx.status === TransactionStatus.Pending
  const wasSubmitted = isUniswapX(tx) || isChained(tx) || Object.keys(tx.options.request).length > 0

  // Non-native connectors can only cancel UniswapX orders
  if (!isNativeAccess) {
    return isUniswapX(tx) && isPending && hasDelayPassed
  }

  return !isSentBridge && isPending && wasSubmitted && hasDelayPassed
}

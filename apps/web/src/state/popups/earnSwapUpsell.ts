import { getEarnSwapUpsellOutputCurrencyId } from 'uniswap/src/features/earn/swapUpsell'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export const EARN_SWAP_UPSELL_POPUP_NO_AUTO_DISMISS_MS = Number.POSITIVE_INFINITY
export const EARN_SWAP_UPSELL_POPUP_DELAY_MS = 500

// The upsell is not in popupRegistry while waiting for the swap toast to close.
// Track those deferred keys separately so repeated activity updates do not enqueue duplicates.
const deferredEarnSwapUpsellPopupKeys = new Set<string>()
const registeredEarnSwapUpsellPopupKeys = new Set<string>()

export function resetEarnSwapUpsellPopupTrackingForTests(): void {
  deferredEarnSwapUpsellPopupKeys.clear()
  registeredEarnSwapUpsellPopupKeys.clear()
}

export function getEarnSwapUpsellPopupKey({
  outputCurrencyId,
  transactionId,
}: {
  outputCurrencyId: string
  transactionId: string
}): string {
  return `earn-swap-upsell-${transactionId}-${outputCurrencyId}`
}

/**
 * Registers the post-swap "earn on your token" upsell popup when a finalized transaction is an
 * eligible swap/bridge to a vault-supported output token. No-op otherwise. Centralizes the
 * eligibility check + popup registration shared across the web activity updaters.
 *
 * When `swapPopupKey` references a currently-visible confirmation toast (e.g. the "Swapped"
 * toast), the upsell is deferred until that toast disappears (user dismissal or auto-close)
 * plus a short delay, so the two toasts never show at the same time.
 */
export function maybeAddEarnSwapUpsellPopup({
  isEarnEnabled = true,
  status,
  typeInfo,
  transactionId,
  swapPopupKey,
}: {
  isEarnEnabled?: boolean
  status: TransactionStatus
  typeInfo: TransactionTypeInfo
  transactionId: string
  swapPopupKey?: string
}): void {
  if (!isEarnEnabled) {
    return
  }

  const outputCurrencyId = getEarnSwapUpsellOutputCurrencyId({
    status,
    typeInfo,
  })
  if (!outputCurrencyId) {
    return
  }
  const upsellPopupKey = getEarnSwapUpsellPopupKey({ outputCurrencyId, transactionId })
  if (registeredEarnSwapUpsellPopupKeys.has(upsellPopupKey) || deferredEarnSwapUpsellPopupKeys.has(upsellPopupKey)) {
    return
  }

  const addUpsellPopup = (): void => {
    deferredEarnSwapUpsellPopupKeys.delete(upsellPopupKey)
    if (registeredEarnSwapUpsellPopupKeys.has(upsellPopupKey)) {
      return
    }
    registeredEarnSwapUpsellPopupKeys.add(upsellPopupKey)
    popupRegistry.addPopup(
      { type: PopupType.EarnSwapUpsell, outputCurrencyId, transactionId, swapAmountUsd: typeInfo.transactedUSDValue },
      upsellPopupKey,
      EARN_SWAP_UPSELL_POPUP_NO_AUTO_DISMISS_MS,
    )
    popupRegistry.onPopupRemoved(upsellPopupKey, () => {
      registeredEarnSwapUpsellPopupKeys.delete(upsellPopupKey)
    })
  }

  if (swapPopupKey && popupRegistry.hasPopup(swapPopupKey)) {
    deferredEarnSwapUpsellPopupKeys.add(upsellPopupKey)
    popupRegistry.onPopupRemoved(swapPopupKey, () => {
      setTimeout(addUpsellPopup, EARN_SWAP_UPSELL_POPUP_DELAY_MS)
    })
    return
  }

  addUpsellPopup()
}

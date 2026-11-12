import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { isEarnPlan } from 'uniswap/src/features/earn/swapUpsell'
import {
  TransactionStatus,
  TransactionType,
  type TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export interface NewUserOnboardingWalletHistory {
  hasCompletedSwap?: boolean
  /** Sticky: a wallet that spends down to $0 shouldn't see the funding step again. */
  hasBeenFunded?: boolean
  /** Hides only the guided swap coachmarks; the checklist and other nudges stay. */
  guidedSwapDismissed?: boolean
}

export interface NewUserOnboardingHistory {
  byWallet: Record<string, NewUserOnboardingWalletHistory>
}

export interface NewUserOnboardingBehaviorHistoryState {
  newUserOnboarding?: NewUserOnboardingHistory
}

export function getNewUserOnboardingWalletKey(address: string): string {
  return normalizeAddress(address, AddressStringFormat.Lowercase)
}

export function getOrCreateNewUserOnboardingWalletHistory(
  state: NewUserOnboardingBehaviorHistoryState,
  address: string,
): NewUserOnboardingWalletHistory {
  state.newUserOnboarding ??= { byWallet: {} }
  return (state.newUserOnboarding.byWallet[getNewUserOnboardingWalletKey(address)] ??= {})
}

export function isNewUserOnboardingSwap({
  status,
  typeInfo,
}: {
  status: TransactionStatus
  typeInfo: TransactionTypeInfo
}): boolean {
  if (status !== TransactionStatus.Success) {
    return false
  }

  switch (typeInfo.type) {
    case TransactionType.Swap:
    case TransactionType.Bridge:
      return true
    case TransactionType.Plan:
      return !isEarnPlan(typeInfo)
    default:
      return false
  }
}

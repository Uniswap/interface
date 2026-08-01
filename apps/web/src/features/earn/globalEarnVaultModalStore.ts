import { type EarnVaultModalInitialView, EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'
import { create } from 'zustand'

type GlobalEarnVaultModalSelection = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  initialView: EarnVaultModalInitialView
  minimumBalanceDataUpdatedAtMs?: number
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceUpsellCurrencyId?: string
  swapAmountUsd?: number
  vault: EarnVaultInfo
}

type GlobalEarnVaultModalState = {
  closeModal: () => void
  openDepositModal: (
    vault: EarnVaultInfo,
    options?: {
      analyticsEntryPoint?: EarnAnalyticsEntryPoint
      minimumBalanceDataUpdatedAtMs?: number
      originatingTransactionId?: string
      projectedMonthlyEarningsUsd?: number
      sourceUpsellCurrencyId?: string
      swapAmountUsd?: number
    },
  ) => void
  selectedVaultState: GlobalEarnVaultModalSelection | null
}

export const useGlobalEarnVaultModalStore = create<GlobalEarnVaultModalState>()((set) => ({
  closeModal: () => set({ selectedVaultState: null }),
  // Global entry points only open deposit for now; withdraw remains scoped to an already-open vault modal.
  openDepositModal: (vault, options) =>
    set({
      selectedVaultState: {
        vault,
        initialView: EarnVaultView.DepositAmount,
        ...options,
      },
    }),
  selectedVaultState: null,
}))

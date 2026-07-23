import { useCallback, useState } from 'react'
import { type EarnVaultModalInitialView, EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'

type EarnVaultModalState = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  initialView: EarnVaultModalInitialView
  vault: EarnVaultInfo
}

type EarnVaultModalTrackingOptions = {
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
}

type OpenEarnVaultModalOptions = EarnVaultModalTrackingOptions & {
  initialView?: EarnVaultModalInitialView
}

type UseEarnVaultModalStateResult = {
  closeModal: () => void
  openDepositModal: (vault: EarnVaultInfo, options?: EarnVaultModalTrackingOptions) => void
  openModal: (vault: EarnVaultInfo, options?: OpenEarnVaultModalOptions) => void
  openWithdrawModal: (vault: EarnVaultInfo, options?: EarnVaultModalTrackingOptions) => void
  selectedVaultState: EarnVaultModalState | null
}

export function useEarnVaultModalState(): UseEarnVaultModalStateResult {
  const [selectedVaultState, setSelectedVaultState] = useState<EarnVaultModalState | null>(null)

  const closeModal = useCallback(() => {
    setSelectedVaultState(null)
  }, [])

  const openModal = useCallback((vault: EarnVaultInfo, options?: OpenEarnVaultModalOptions) => {
    const { initialView = EarnVaultView.Vault, ...stateOptions } = options ?? {}

    setSelectedVaultState({ vault, initialView, ...stateOptions })
  }, [])

  const openDepositModal = useCallback((vault: EarnVaultInfo, options?: EarnVaultModalTrackingOptions) => {
    setSelectedVaultState({
      vault,
      initialView: EarnVaultView.DepositAmount,
      ...options,
    })
  }, [])

  const openWithdrawModal = useCallback((vault: EarnVaultInfo, options?: EarnVaultModalTrackingOptions) => {
    setSelectedVaultState({
      vault,
      initialView: EarnVaultView.WithdrawAmount,
      ...options,
    })
  }, [])

  return {
    closeModal,
    openDepositModal,
    openModal,
    openWithdrawModal,
    selectedVaultState,
  }
}

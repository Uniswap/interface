import { useCallback, useState } from 'react'
import { type EarnVaultModalInitialView, EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'

type EarnVaultModalState = {
  initialView: EarnVaultModalInitialView
  vault: EarnVaultInfo
}

type UseEarnVaultModalStateResult = {
  closeModal: () => void
  openDepositModal: (vault: EarnVaultInfo) => void
  openModal: (vault: EarnVaultInfo, initialView?: EarnVaultModalInitialView) => void
  openWithdrawModal: (vault: EarnVaultInfo) => void
  selectedVaultState: EarnVaultModalState | null
}

export function useEarnVaultModalState(): UseEarnVaultModalStateResult {
  const [selectedVaultState, setSelectedVaultState] = useState<EarnVaultModalState | null>(null)

  const closeModal = useCallback(() => {
    setSelectedVaultState(null)
  }, [])

  const openModal = useCallback(
    (vault: EarnVaultInfo, initialView: EarnVaultModalInitialView = EarnVaultView.Vault) => {
      setSelectedVaultState({ vault, initialView })
    },
    [],
  )

  const openDepositModal = useCallback((vault: EarnVaultInfo) => {
    setSelectedVaultState({ vault, initialView: EarnVaultView.DepositAmount })
  }, [])

  const openWithdrawModal = useCallback((vault: EarnVaultInfo) => {
    setSelectedVaultState({ vault, initialView: EarnVaultView.WithdrawAmount })
  }, [])

  return {
    closeModal,
    openDepositModal,
    openModal,
    openWithdrawModal,
    selectedVaultState,
  }
}

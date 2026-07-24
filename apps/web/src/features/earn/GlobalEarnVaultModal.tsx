import { lazy, Suspense, useEffect } from 'react'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useGlobalEarnVaultModalStore } from '~/features/earn/globalEarnVaultModalStore'

const EarnVaultModal = lazy(() =>
  import('~/features/earn/EarnVaultModal').then((module) => ({ default: module.EarnVaultModal })),
)

export function GlobalEarnVaultModal(): JSX.Element | null {
  const isEarnEnabled = useIsEarnEnabled()
  const closeModal = useGlobalEarnVaultModalStore((s) => s.closeModal)
  const selectedVaultState = useGlobalEarnVaultModalStore((s) => s.selectedVaultState)

  useEffect(() => {
    if (!isEarnEnabled && selectedVaultState) {
      closeModal()
    }
  }, [closeModal, isEarnEnabled, selectedVaultState])

  if (!selectedVaultState || !isEarnEnabled) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <EarnVaultModal
        analyticsEntryPoint={selectedVaultState.analyticsEntryPoint}
        vault={selectedVaultState.vault}
        initialView={selectedVaultState.initialView}
        minimumBalanceDataUpdatedAtMs={selectedVaultState.minimumBalanceDataUpdatedAtMs}
        originatingTransactionId={selectedVaultState.originatingTransactionId}
        projectedMonthlyEarningsUsd={selectedVaultState.projectedMonthlyEarningsUsd}
        sourceUpsellCurrencyId={selectedVaultState.sourceUpsellCurrencyId}
        swapAmountUsd={selectedVaultState.swapAmountUsd}
        isOpen
        onClose={closeModal}
      />
    </Suspense>
  )
}

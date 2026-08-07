import { lazy, Suspense, useEffect } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useGlobalEarnVaultModalStore } from '~/features/earn/globalEarnVaultModalStore'

const EarnVaultModal = lazy(() =>
  import('~/features/earn/EarnVaultModal').then((module) => ({ default: module.EarnVaultModal })),
)

export function GlobalEarnVaultModal(): JSX.Element | null {
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const isEarnAvailable = isEarnEnabled && !isTestnetModeEnabled
  const closeModal = useGlobalEarnVaultModalStore((s) => s.closeModal)
  const selectedVaultState = useGlobalEarnVaultModalStore((s) => s.selectedVaultState)

  useEffect(() => {
    if (!isEarnAvailable && selectedVaultState) {
      closeModal()
    }
  }, [closeModal, isEarnAvailable, selectedVaultState])

  if (!selectedVaultState || !isEarnAvailable) {
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

import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { TokenDetailsEarnSection as SharedTokenDetailsEarnSection } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnSection'
import { EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE } from 'uniswap/src/utils/linking'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnSectionProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnSection({ earnData }: TokenDetailsEarnSectionProps): JSX.Element | null {
  const { closeModal, openDepositModal, openModal, openWithdrawModal, selectedVaultState } = useEarnVaultModalState()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldAutoOpenModal = searchParams.get(EARN_VAULT_MODAL_QUERY_PARAM) === EARN_VAULT_MODAL_QUERY_VALUE

  const { earnPosition, earnVault, userHasEarnPosition } = earnData

  // Auto-open the modal when deep-linked via ?modal=earn-vault (e.g., from the extension's
  // earn positions list). Waits for `earnVault` to load before opening, then strips the param
  // so refresh/back-nav doesn't re-trigger.
  useEffect(() => {
    if (!shouldAutoOpenModal || !earnVault) {
      return
    }
    openModal(earnVault)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(EARN_VAULT_MODAL_QUERY_PARAM)
        return next
      },
      { replace: true },
    )
  }, [shouldAutoOpenModal, earnVault, openModal, setSearchParams])

  if (!earnVault) {
    return null
  }

  return (
    <>
      {earnPosition && userHasEarnPosition && (
        <SharedTokenDetailsEarnSection
          earnVault={earnVault}
          earnPosition={earnPosition}
          onPositionPress={(vault) => openModal(vault)}
          onWithdrawPress={(vault) => openWithdrawModal(vault)}
          onDepositPress={(vault) => openDepositModal(vault)}
        />
      )}

      <EarnVaultModal
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState ? earnPosition : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
      />
    </>
  )
}

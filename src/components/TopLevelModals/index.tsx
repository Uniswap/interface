import AddressClaimModal from 'components/claim/AddressClaimModal'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

export default function TopLevelModals() {
  const addressClaimOpen = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked />
    </>
  )
}

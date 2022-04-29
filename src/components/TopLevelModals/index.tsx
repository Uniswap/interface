import AddressClaimModal from 'components/claim/AddressClaimModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

export default function TopLevelModals() {
  const addressClaimOpen = useModalOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  const blockedAccountModalOpen = useModalOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useActiveWeb3React()

  useAccountRiskCheck(account)
  const open = Boolean(blockedAccountModalOpen && account)
  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account} isOpen={open} />
    </>
  )
}

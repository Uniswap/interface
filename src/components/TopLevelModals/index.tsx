import { useWeb3React } from '@web3-react/core'
import UniwalletModal from 'components/AccountDrawer/UniwalletModal'
import UniswapWalletBanner from 'components/Banner/UniswapWalletBanner'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import FiatOnrampModal from 'components/FiatOnrampModal'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { lazy } from 'react'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { retry } from 'utils/retry'

const Bag = lazy(() => retry(() => import('nft/components/bag/Bag')))
const TransactionCompleteModal = lazy(() => retry(() => import('nft/components/collection/TransactionCompleteModal')))
const AirdropModal = lazy(() => retry(() => import('components/AirdropModal')))

export default function TopLevelModals() {
  const addressClaimOpen = useModalIsOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useWeb3React()
  useAccountRiskCheck(account)
  const accountBlocked = Boolean(blockedAccountModalOpen && account)

  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account} isOpen={accountBlocked} />
      <Bag />
      <UniwalletModal />
      <UniswapWalletBanner />
      <TransactionCompleteModal />
      <AirdropModal />
      <FiatOnrampModal />
    </>
  )
}

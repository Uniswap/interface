import { useWeb3React } from '@web3-react/core'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import FiatOnrampModal from 'components/FiatOnrampModal'
import TaxServiceBanner from 'components/TaxServiceModal/TaxServiceBanner'
import { useTaxServiceBannerEnabled } from 'featureFlags/flags/taxServiceBanner'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useIsPoolsPage } from 'hooks/useIsPoolsPage'
import { lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

const Bag = lazy(() => import('nft/components/bag/Bag'))
const TransactionCompleteModal = lazy(() => import('nft/components/collection/TransactionCompleteModal'))
const AirdropModal = lazy(() => import('components/AirdropModal'))

export default function TopLevelModals() {
  const addressClaimOpen = useModalIsOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useWeb3React()
  useAccountRiskCheck(account)
  const accountBlocked = Boolean(blockedAccountModalOpen && account)
  const taxServiceEnabled = useTaxServiceBannerEnabled()

  const { pathname } = useLocation()
  const isNftPage = useIsNftPage()
  const isPoolPage = useIsPoolsPage()

  const isTaxModalServicePage = isNftPage || isPoolPage || pathname.startsWith('/swap')

  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account} isOpen={accountBlocked} />
      <Bag />
      <TransactionCompleteModal />
      <AirdropModal />
      <FiatOnrampModal />
      {taxServiceEnabled && isTaxModalServicePage && <TaxServiceBanner />}
    </>
  )
}

import { useWeb3React } from '@web3-react/core'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import FiatOnrampModal from 'components/FiatOnrampModal'
import { BaseVariant } from 'featureFlags'
import { useFiatOnrampFlag } from 'featureFlags/flags/fiatOnramp'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import NftExploreBanner from 'nft/components/nftExploreBanner/NftExploreBanner'
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
  const location = useLocation()
  const fiatOnrampFlagEnabled = useFiatOnrampFlag() === BaseVariant.Enabled
  const pageShowsNftPromoBanner =
    !fiatOnrampFlagEnabled &&
    (location.pathname.startsWith('/swap') ||
      location.pathname.startsWith('/tokens') ||
      location.pathname.startsWith('/pool'))
  useAccountRiskCheck(account)
  const accountBlocked = Boolean(blockedAccountModalOpen && account)
  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account} isOpen={accountBlocked} />
      <Bag />
      <TransactionCompleteModal />
      <AirdropModal />
      {pageShowsNftPromoBanner && <NftExploreBanner />}
      {fiatOnrampFlagEnabled && <FiatOnrampModal />}
    </>
  )
}

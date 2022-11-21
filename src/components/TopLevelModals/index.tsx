import { useWeb3React } from '@web3-react/core'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import NftExploreBanner from 'nft/components/nftExploreBanner/NftExploreBanner'
import { lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

const Bag = lazy(() => import('nft/components/bag/Bag'))
const TransactionCompleteModal = lazy(() => import('nft/components/collection/TransactionCompleteModal'))
const AirdropModal = lazy(() => import('components/AidropModal'))

export default function TopLevelModals() {
  const addressClaimOpen = useModalIsOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)

  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useWeb3React()
  const location = useLocation()

  useAccountRiskCheck(account)
  const open = Boolean(blockedAccountModalOpen && account)
  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account} isOpen={open} />
      {location.pathname.includes('/swap') && <NftExploreBanner />}
      {location.pathname.includes('/tokens') && <NftExploreBanner />}
      {location.pathname.includes('/pool') && <NftExploreBanner />}
      <Bag />
      {useNftFlag() === NftVariant.Enabled && <TransactionCompleteModal />}
      {useNftFlag() === NftVariant.Enabled && <AirdropModal />}
    </>
  )
}

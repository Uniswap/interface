import { useWeb3React } from '@web3-react/core'
import { OffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { lazy } from 'react'
import { useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

const Bag = lazy(() => import('nft/components/bag/Bag'))
const TransactionCompleteModal = lazy(() => import('nft/components/collection/TransactionCompleteModal'))

export default function TopLevelModals() {
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useWeb3React()
  useAccountRiskCheck(account)
  const accountBlocked = Boolean(blockedAccountModalOpen && account)

  return (
    <>
      <ConnectedAccountBlocked account={account} isOpen={accountBlocked} />
      <Bag />
      <OffchainActivityModal />
      <TransactionCompleteModal />
      {/* <FiatOnrampModal /> */}
    </>
  )
}

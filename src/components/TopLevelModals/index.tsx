import { useWeb3React } from '@web3-react/core'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'

export default function TopLevelModals() {
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const { account } = useWeb3React()
  useAccountRiskCheck(account)
  const accountBlocked = Boolean(blockedAccountModalOpen && account)

  return (
    <>
      {/* <ConnectedAccountBlocked account={account} isOpen={accountBlocked} /> */}
      {/* <OffchainActivityModal /> */}
      {/* <FiatOnrampModal /> */}
    </>
  )
}

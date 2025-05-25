import { useSmartWalletNudges } from 'src/app/context/SmartWalletNudgesContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { PostSwapSmartWalletNudge } from 'wallet/src/components/smartWallet/modals/PostSwapSmartWalletNudge'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'

export function SmartWalletNudgeModals(): JSX.Element | null {
  const { activeModal, closeModal, openModal, dappInfo } = useSmartWalletNudges()

  if (!activeModal) {
    return null
  }

  switch (activeModal) {
    case ModalName.PostSwapSmartWalletNudge:
      return (
        <PostSwapSmartWalletNudge
          isOpen
          onClose={closeModal}
          dappInfo={dappInfo}
          onEnableSmartWallet={() => openModal(ModalName.SmartWalletEnabledModal)}
        />
      )
    case ModalName.SmartWalletEnabledModal:
      return <SmartWalletEnabledModal isOpen showReconnectDappPrompt={!!dappInfo} onClose={closeModal} />
    default:
      return null
  }
}

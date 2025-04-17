import { AppStackScreenProp } from 'src/app/navigation/types'
import { RemoveWalletContent } from 'src/components/RemoveWallet/RemoveWalletContent'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function RemoveWalletModal({ route }: AppStackScreenProp<typeof ModalName.RemoveWallet>): JSX.Element | null {
  const colors = useSporeColors()
  const { onClose } = useReactNavigationModal()
  const address = route.params?.address

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.RemoveSeedPhraseWarningModal} onClose={onClose}>
      <RemoveWalletContent address={address} onClose={onClose} />
    </Modal>
  )
}

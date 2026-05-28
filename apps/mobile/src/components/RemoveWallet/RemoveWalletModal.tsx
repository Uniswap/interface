import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { RemoveWalletContent } from 'src/components/RemoveWallet/RemoveWalletContent'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function RemoveWalletModal({ route }: AppStackScreenProp<typeof ModalName.RemoveWallet>): JSX.Element | null {
  const colors = useSporeColors()
  const { onClose } = useReactNavigationModal()
  const { address, replaceMnemonic } = route.params ?? {}

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.RemoveSeedPhraseWarningModal} onClose={onClose}>
      <RemoveWalletContent address={address} replaceMnemonic={replaceMnemonic} onClose={onClose} />
    </Modal>
  )
}

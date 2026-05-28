import { default as React } from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { ConnectedDappsList } from 'src/components/Requests/ConnectedDapps/ConnectedDappsList'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ConnectionsDappListModal({
  route,
}: AppStackScreenProp<typeof ModalName.ConnectionsDappListModal>): JSX.Element {
  const { onClose } = useReactNavigationModal()
  const { address } = route.params
  const { sessions } = useWalletConnect(address)

  return (
    <Modal fullScreen name={ModalName.ConnectionsDappListModal} onClose={onClose}>
      <ConnectedDappsList
        backButton={<BackButton onPressBack={onClose} />}
        sessions={sessions}
        selectedAddress={address}
      />
    </Modal>
  )
}

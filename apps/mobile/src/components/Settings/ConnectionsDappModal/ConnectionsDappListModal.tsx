import { default as React } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { BackButton } from 'src/components/buttons/BackButton'
import { ConnectedDappsList } from 'src/components/Requests/ConnectedDapps/ConnectedDappsList'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useWalletConnect } from 'src/features/walletConnect/useWalletConnect'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ConnectionsDappListModal(): JSX.Element {
  const dispatch = useDispatch()
  const { initialState } = useSelector(selectModalState(ModalName.ConnectionsDappListModal))
  const address = initialState?.address ?? ''
  const { sessions } = useWalletConnect(address)

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.ConnectionsDappListModal }))
  }

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

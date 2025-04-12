import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RemoveWalletContent } from 'src/components/RemoveWallet/RemoveWalletContent'
import { closeModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function RemoveWalletModal(): JSX.Element | null {
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const { initialState } = useSelector(selectModalState(ModalName.RemoveWallet))
  const address = initialState?.address

  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.RemoveWallet }))
  }, [dispatch])

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.RemoveSeedPhraseWarningModal} onClose={onClose}>
      <RemoveWalletContent address={address} onClose={onClose} />
    </Modal>
  )
}

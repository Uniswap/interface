import React, { PropsWithChildren } from 'react'
import { useDispatch } from 'react-redux'
import { ModalsState } from 'src/features/modals/ModalsState'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalProps } from 'uniswap/src/components/modals/ModalProps'

/**
 * This is a wrapper around the Modal component intended but not limited to
 * more complex modals that require full screen navigation.
 */
export function FullScreenNavModal({
  name,
  children,
  ...modalProps
}: PropsWithChildren<
  {
    name: keyof ModalsState
  } & ModalProps
>): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()

  const onClose = (): void => {
    dispatch(closeModal({ name }))
  }

  return (
    <Modal
      {...modalProps}
      fullScreen
      hideKeyboardOnDismiss
      renderBehindBottomInset
      renderBehindTopInset
      backgroundColor={colors.surface1.val}
      hideHandlebar={true}
      name={name}
      onClose={onClose}
    >
      {children}
    </Modal>
  )
}

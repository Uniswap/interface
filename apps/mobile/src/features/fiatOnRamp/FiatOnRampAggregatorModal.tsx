import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { FiatOnRampStackNavigator } from 'src/app/navigation/navigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function FiatOnRampAggregatorModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.FiatOnRampAggregator }))
  }, [dispatch])

  return (
    <Modal
      fullScreen
      hideHandlebar
      hideKeyboardOnDismiss
      renderBehindTopInset
      backgroundColor={colors.surface1.val}
      name={ModalName.FiatOnRampAggregator}
      onClose={onClose}
    >
      <FiatOnRampStackNavigator />
    </Modal>
  )
}

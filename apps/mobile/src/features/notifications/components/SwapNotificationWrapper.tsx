import React from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { useNavigateToProfileTab } from 'src/features/notifications/hooks/useNavigateToProfileTab'
import { SwapNotification } from 'wallet/src/features/notifications/components/SwapNotification'
import { SwapTxNotification } from 'wallet/src/features/notifications/types'
import { useCreateSwapFormState } from 'wallet/src/features/transactions/hooks'
import { ModalName } from 'wallet/src/telemetry/constants'

export function SwapNotificationWrapper({
  notification,
}: {
  notification: SwapTxNotification
}): JSX.Element {
  const { address, chainId, txId } = notification

  const dispatch = useAppDispatch()

  const { onPress, onPressIn } = useNavigateToProfileTab(address)

  const swapFormState = useCreateSwapFormState(address, chainId, txId)

  const onRetry = (): void => {
    dispatch(closeModal({ name: ModalName.Swap }))
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState ?? undefined }))
  }

  return (
    <SwapNotification
      notification={notification}
      onPress={onPress}
      onPressIn={onPressIn}
      onRetry={onRetry}
    />
  )
}

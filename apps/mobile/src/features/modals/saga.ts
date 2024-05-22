import { PayloadAction } from '@reduxjs/toolkit'
import { setTag } from '@sentry/react-native'
import {
  closeModal,
  CloseModalParams,
  openModal,
  OpenModalParams,
} from 'src/features/modals/modalSlice'
import { takeEvery } from 'typed-redux-saga'
import { ModalName } from 'wallet/src/telemetry/constants'

export function* modalWatcher() {
  yield* takeEvery(openModal, handleOpenModalAction)
  yield* takeEvery(closeModal, handleCloseModalAction)
}

function handleOpenModalAction(action: PayloadAction<OpenModalParams>) {
  if (action.payload.name === ModalName.Swap) {
    setTag('in_swap', true)
  }
}

function handleCloseModalAction(action: PayloadAction<CloseModalParams>) {
  if (action.payload.name === ModalName.Swap) {
    setTag('in_swap', false)
  }
}

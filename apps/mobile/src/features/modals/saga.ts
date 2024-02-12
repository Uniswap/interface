import { PayloadAction } from '@reduxjs/toolkit'
import { setTag } from '@sentry/react-native'
import {
  closeModal,
  CloseModalParams,
  openModal,
  OpenModalParams,
} from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { takeEvery } from 'typed-redux-saga'

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

import { PayloadAction } from '@reduxjs/toolkit'
import { closeModal, CloseModalParams, openModal, OpenModalParams } from 'src/features/modals/modalSlice'
import { takeEvery } from 'typed-redux-saga'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'

export function* modalWatcher() {
  yield* takeEvery(openModal, handleOpenModalAction)
  yield* takeEvery(closeModal, handleCloseModalAction)
}

function handleOpenModalAction(action: PayloadAction<OpenModalParams>) {
  if (action.payload.name === ModalName.Swap) {
    setAttributesToDatadog({ in_swap: true }).catch(() => undefined)
  }
}

function handleCloseModalAction(action: PayloadAction<CloseModalParams>) {
  if (action.payload.name === ModalName.Swap) {
    setAttributesToDatadog({ in_swap: false }).catch(() => undefined)
  }
}

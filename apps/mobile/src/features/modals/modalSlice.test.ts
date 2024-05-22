import { createStore, Store } from '@reduxjs/toolkit'
import {
  closeModal,
  initialModalsState,
  modalsReducer,
  openModal,
} from 'src/features/modals/modalSlice'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { ModalName } from 'wallet/src/telemetry/constants'
import { ModalsState } from './ModalsState'

const initialState = { ...initialModalsState }
const modalName = ModalName.WalletConnectScan

describe('modals reducer', () => {
  let store: Store<ModalsState>

  beforeEach(() => {
    store = createStore(modalsReducer, initialState)
  })

  it('opens modals and sets initial state', () => {
    expect(store.getState()[modalName].isOpen).toEqual(false)

    store.dispatch(openModal({ name: modalName, initialState: ScannerModalState.ScanQr }))
    expect(store.getState()[modalName].isOpen).toEqual(true)
    expect(store.getState()[modalName].initialState).toEqual(ScannerModalState.ScanQr)
  })

  it('closes modals', () => {
    // initially closed
    expect(store.getState()[modalName].isOpen).toEqual(false)

    // open it
    store.dispatch(openModal({ name: modalName, initialState: ScannerModalState.ScanQr }))
    expect(store.getState()[modalName].isOpen).toEqual(true)

    // now close it
    store.dispatch(closeModal({ name: modalName }))
    expect(store.getState()[modalName].isOpen).toEqual(false)
    expect(store.getState()[modalName].initialState).toEqual(undefined)
  })
})

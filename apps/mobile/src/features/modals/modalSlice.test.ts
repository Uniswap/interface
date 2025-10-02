import { createStore, Store } from '@reduxjs/toolkit'
import { ModalsState } from 'src/features/modals/ModalsState'
import { closeModal, initialModalsState, modalsReducer, openModal } from 'src/features/modals/modalSlice'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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

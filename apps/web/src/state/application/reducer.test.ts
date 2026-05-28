import { createStore, Store } from 'redux'
import reducer, { ApplicationState, setCloseModal, setOpenModal, updateChainId } from 'state/application/reducer'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      chainId: null,
      openModal: null,
      suppressedPopups: [],
      downloadGraduatedWalletCardsDismissed: [],
    })
  })

  describe('setOpenModal', () => {
    it('should correctly set the open modal', () => {
      store.dispatch(setOpenModal({ name: ModalName.ClaimPopup }))
      expect(store.getState().openModal).toEqual({ name: ModalName.ClaimPopup })
      store.dispatch(setCloseModal())
      expect(store.getState().openModal).toEqual(null)
    })
  })

  describe('updateChainId', () => {
    it('updates chain id', () => {
      expect(store.getState().chainId).toEqual(null)

      store.dispatch(updateChainId({ chainId: 1 }))

      expect(store.getState().chainId).toEqual(1)
    })
  })
})

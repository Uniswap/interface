import { createStore, Store } from 'redux'
import reducer, {
  ApplicationModal,
  ApplicationState,
  setCloseModal,
  setOpenModal,
  updateChainId,
} from 'state/application/reducer'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      chainId: null,
      openModal: null,
      suppressedPopups: [],
    })
  })

  describe('setOpenModal', () => {
    it('should correctly set the open modal', () => {
      store.dispatch(setOpenModal({ name: ApplicationModal.CLAIM_POPUP }))
      expect(store.getState().openModal).toEqual({ name: ApplicationModal.CLAIM_POPUP })
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

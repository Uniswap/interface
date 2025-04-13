import { createStore, Store } from 'redux'
import reducer, {
  ApplicationModal,
  ApplicationState,
  setCloseModal,
  setOpenModal,
  setSmartPoolValue,
  updateChainId,
} from 'state/application/reducer'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      chainId: null,
      openModal: null,
      smartPool: { address: null, name: '' },
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

  describe('setSmartPoolValue', () => {
    it('sets smart pool address and name', () => {
      expect(store.getState().smartPool.address).toEqual(null)
      expect(store.getState().smartPool.name).toEqual('')

      store.dispatch(setSmartPoolValue({ smartPool: { address: '0x01', name: 'a' } }))

      expect(store.getState().smartPool.address).toEqual('0x01')
      expect(store.getState().smartPool.name).toEqual('a')
    })
  })
})

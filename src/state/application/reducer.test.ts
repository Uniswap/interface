import { createStore, Store } from 'redux'

import reducer, {
  addPopup,
  ApplicationModal,
  ApplicationState,
  removePopup,
  setOpenModal,
  updateChainId,
} from './reducer'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      fiatOnramp: { available: false, availabilityChecked: false },
      chainId: null,
      openModal: null,
      popupList: [],
    })
  })

  describe('popupList', () => {
    describe('addPopup', () => {
      it('adds the popup to list with a generated id', () => {
        store.dispatch(addPopup({ content: { txn: { hash: 'abc' } } }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: expect.any(String),
            show: true,
            content: { txn: { hash: 'abc' } },
            removeAfterMs: 10000,
          },
        ])
      })

      it('replaces any existing popups with the same key', () => {
        store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'abc' } } }))
        store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'def' } } }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: 'abc',
            show: true,
            content: { txn: { hash: 'def' } },
            removeAfterMs: 10000,
          },
        ])
      })
    })

    describe('removePopup', () => {
      beforeEach(() => {
        store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'abc' } } }))
      })

      it('hides the popup', () => {
        store.dispatch(removePopup({ key: 'abc' }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: 'abc',
            show: false,
            content: { txn: { hash: 'abc' } },
            removeAfterMs: 10000,
          },
        ])
      })
    })
  })

  describe('setOpenModal', () => {
    it('set wallet modal', () => {
      store.dispatch(setOpenModal(ApplicationModal.WALLET))
      expect(store.getState().openModal).toEqual(ApplicationModal.WALLET)
      store.dispatch(setOpenModal(ApplicationModal.WALLET))
      expect(store.getState().openModal).toEqual(ApplicationModal.WALLET)
      store.dispatch(setOpenModal(ApplicationModal.CLAIM_POPUP))
      expect(store.getState().openModal).toEqual(ApplicationModal.CLAIM_POPUP)
      store.dispatch(setOpenModal(null))
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

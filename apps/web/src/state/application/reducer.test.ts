import { createStore, Store } from 'redux'
import reducer, {
  addPopup,
  ApplicationModal,
  ApplicationState,
  PopupType,
  removePopup,
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
      popupList: [],
      suppressedPopups: [],
    })
  })

  describe('popupList', () => {
    describe('addPopup', () => {
      it('adds the popup to list with a generated id', () => {
        store.dispatch(addPopup({ content: { type: PopupType.Transaction, hash: 'abc' } }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: expect.any(String),
            show: true,
            content: { type: PopupType.Transaction, hash: 'abc' },
            removeAfterMs: 10000,
          },
        ])
      })

      it('replaces any existing popups with the same key', () => {
        store.dispatch(addPopup({ key: 'abc', content: { type: PopupType.Transaction, hash: 'abc' } }))
        store.dispatch(addPopup({ key: 'abc', content: { type: PopupType.Transaction, hash: 'abc' } }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: 'abc',
            show: true,
            content: { type: PopupType.Transaction, hash: 'abc' },
            removeAfterMs: 10000,
          },
        ])
      })
    })

    describe('removePopup', () => {
      beforeEach(() => {
        store.dispatch(addPopup({ key: 'abc', content: { type: PopupType.Transaction, hash: 'abc' } }))
      })

      it('hides the popup', () => {
        store.dispatch(removePopup({ key: 'abc' }))
        const list = store.getState().popupList
        expect(list).toEqual([
          {
            key: 'abc',
            show: false,
            content: { type: PopupType.Transaction, hash: 'abc' },
            removeAfterMs: 10000,
          },
        ])
      })
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

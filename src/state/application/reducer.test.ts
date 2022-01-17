import { createStore, Store } from 'redux'

import reducer, {
  addPopup,
  ApplicationModal,
  ApplicationState,
  removePopup,
  setOpenModal,
  updateBlockNumber,
  updateChainId,
} from './reducer'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      blockNumber: {
        1: 3,
      },
      chainId: null,
      openModal: null,
      popupList: [],
    })
  })

  describe('addPopup', () => {
    it('adds the popup to list with a generated id', () => {
      store.dispatch(addPopup({ content: { txn: { hash: 'abc' } } }))
      const list = store.getState().popupList
      expect(list).toHaveLength(1)
      expect(typeof list[0].key).toEqual('string')
      expect(list[0].show).toEqual(true)
      expect(list[0].content).toEqual({ txn: { hash: 'abc' } })
      expect(list[0].removeAfterMs).toEqual(25000)
    })

    it('replaces any existing popups with the same key', () => {
      store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'abc' } } }))
      store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'def' } } }))
      const list = store.getState().popupList
      expect(list).toHaveLength(1)
      expect(list[0].key).toEqual('abc')
      expect(list[0].show).toEqual(true)
      expect(list[0].content).toEqual({ txn: { hash: 'def' } })
      expect(list[0].removeAfterMs).toEqual(25000)
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

  describe('updateBlockNumber', () => {
    it('updates block number', () => {
      store.dispatch(updateBlockNumber({ chainId: 1, blockNumber: 4 }))
      expect(store.getState().blockNumber[1]).toEqual(4)
    })
    it('no op if late', () => {
      store.dispatch(updateBlockNumber({ chainId: 1, blockNumber: 2 }))
      expect(store.getState().blockNumber[1]).toEqual(3)
    })
    it('works with non-set chains', () => {
      store.dispatch(updateBlockNumber({ chainId: 3, blockNumber: 2 }))
      expect(store.getState().blockNumber).toEqual({
        1: 3,
        3: 2,
      })
    })
  })

  describe('removePopup', () => {
    beforeEach(() => {
      store.dispatch(addPopup({ key: 'abc', content: { txn: { hash: 'abc' } } }))
    })
    it('hides the popup', () => {
      expect(store.getState().popupList[0].show).toBe(true)
      store.dispatch(removePopup({ key: 'abc' }))
      expect(store.getState().popupList).toHaveLength(1)
      expect(store.getState().popupList[0].show).toBe(false)
    })
  })
})

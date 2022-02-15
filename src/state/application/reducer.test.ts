import { ChainId } from '@swapr/sdk'
import { createStore, Store } from 'redux'
import { ApplicationModal, setOpenModal, updateBlockNumber } from './actions'
import reducer, { ApplicationState } from './reducer'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = createStore(reducer, {
      popupList: [],
      blockNumber: {
        [ChainId.MAINNET]: 3
      },
      openModal: null
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

  describe('updateBlockNumber', () => {
    it('updates block number', () => {
      store.dispatch(updateBlockNumber({ chainId: ChainId.MAINNET, blockNumber: 4 }))
      expect(store.getState().blockNumber[ChainId.MAINNET]).toEqual(4)
    })
    it('no op if late', () => {
      store.dispatch(updateBlockNumber({ chainId: ChainId.MAINNET, blockNumber: 2 }))
      expect(store.getState().blockNumber[ChainId.MAINNET]).toEqual(3)
    })
    it('works with non-set chains', () => {
      store.dispatch(updateBlockNumber({ chainId: ChainId.RINKEBY, blockNumber: 2 }))
      expect(store.getState().blockNumber).toEqual({
        [ChainId.MAINNET]: 3,
        [ChainId.RINKEBY]: 2
      })
    })
  })
})

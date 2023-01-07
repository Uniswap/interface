import { createStore, Store } from '@reduxjs/toolkit'

import {
  addMulticallListeners,
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  removeMulticallListeners,
  updateMulticallResults,
} from './actions'
import reducer, { MulticallState } from './reducer'

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'

describe('multicall reducer', () => {
  let store: Store<MulticallState>
  beforeEach(() => {
    store = createStore(reducer)
  })

  it('has correct initial state', () => {
    expect(store.getState().callResults).toEqual({})
    expect(store.getState().callListeners).toEqual(undefined)
  })

  describe('addMulticallListeners', () => {
    it('adds listeners', () => {
      store.dispatch(
        addMulticallListeners({
          chainId: 1,
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({
        callListeners: {
          [1]: {
            [`${DAI_ADDRESS}-0x`]: {
              [1]: 1,
            },
          },
        },
        callResults: {},
      })
    })
  })

  describe('removeMulticallListeners', () => {
    it('noop', () => {
      store.dispatch(
        removeMulticallListeners({
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          chainId: 1,
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({ callResults: {}, callListeners: {} })
    })
    it('removes listeners', () => {
      store.dispatch(
        addMulticallListeners({
          chainId: 1,
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          options: { blocksPerFetch: 1 },
        })
      )
      store.dispatch(
        removeMulticallListeners({
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          chainId: 1,
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {},
        callListeners: { [1]: { [`${DAI_ADDRESS}-0x`]: {} } },
      })
    })
  })

  describe('updateMulticallResults', () => {
    it('updates data if not present', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 1,
              data: '0x',
            },
          },
        },
      })
    })
    it('updates old data', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x',
          },
        })
      )
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2',
            },
          },
        },
      })
    })
    it('ignores late updates', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2',
          },
        })
      )
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x1',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2',
            },
          },
        },
      })
    })
  })
  describe('fetchingMulticallResults', () => {
    it('updates state to fetching', () => {
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 2 },
          },
        },
      })
    })

    it('updates state to fetching even if already fetching older block', () => {
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 3,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 3 },
          },
        },
      })
    })

    it('does not do update if fetching newer block', () => {
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 1,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 2 },
          },
        },
      })
    })
  })

  describe('errorFetchingMulticallResults', () => {
    it('does nothing if not fetching', () => {
      store.dispatch(
        errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 1,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {},
        },
      })
    })
    it('updates block number if we were fetching', () => {
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: {
              blockNumber: 2,
              // null data indicates error
              data: null,
            },
          },
        },
      })
    })
    it('does nothing if not errored on latest block', () => {
      store.dispatch(
        fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 3,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 3 },
          },
        },
      })
    })
  })
})

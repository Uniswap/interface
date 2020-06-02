import { addMulticallListeners, removeMulticallListeners, updateMulticallResults } from './actions'
import reducer, { MulticallState } from './reducer'
import { Store, createStore } from '@reduxjs/toolkit'

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
              address: '0x',
              callData: '0x'
            }
          ]
        })
      )
      expect(store.getState()).toEqual({
        callListeners: {
          [1]: {
            '0x-0x': {
              [1]: 1
            }
          }
        },
        callResults: {}
      })
    })
  })

  describe('removeMulticallListeners', () => {
    it('noop', () => {
      store.dispatch(
        removeMulticallListeners({
          calls: [
            {
              address: '0x',
              callData: '0x'
            }
          ],
          chainId: 1
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
              address: '0x',
              callData: '0x'
            }
          ]
        })
      )
      store.dispatch(
        removeMulticallListeners({
          calls: [
            {
              address: '0x',
              callData: '0x'
            }
          ],
          chainId: 1
        })
      )
      expect(store.getState()).toEqual({ callResults: {}, callListeners: { [1]: { '0x-0x': {} } } })
    })
  })

  describe('updateMulticallResults', () => {
    it('updates data if not present', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x'
          }
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 1,
              data: '0x'
            }
          }
        }
      })
    })
    it('updates old data', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x'
          }
        })
      )
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2'
          }
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2'
            }
          }
        }
      })
    })
    it('ignores late updates', () => {
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2'
          }
        })
      )
      store.dispatch(
        updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x1'
          }
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2'
            }
          }
        }
      })
    })
  })
})

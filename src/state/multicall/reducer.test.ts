import { addMulticallListeners, removeMulticallListeners } from './actions'
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
})

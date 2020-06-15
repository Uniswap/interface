import { createStore, Store } from 'redux'
import { Field, selectToken } from './actions'
import reducer, { SwapState } from './reducer'

describe('swap reducer', () => {
  let store: Store<SwapState>

  beforeEach(() => {
    store = createStore(reducer, {
      [Field.OUTPUT]: { address: '' },
      [Field.INPUT]: { address: '' },
      typedValue: '',
      independentField: Field.INPUT
    })
  })

  describe('selectToken', () => {
    it('changes token', () => {
      store.dispatch(
        selectToken({
          field: Field.OUTPUT,
          address: '0x0000'
        })
      )

      expect(store.getState()).toEqual({
        [Field.OUTPUT]: { address: '0x0000' },
        [Field.INPUT]: { address: '' },
        typedValue: '',
        independentField: Field.INPUT
      })
    })
  })
})

import { createStore, Store } from 'redux'

import { Field, typeInput } from './actions'
import reducer, { initialState, MintState } from './reducer'

describe('mint reducer', () => {
  let store: Store<MintState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('typeInput', () => {
    it('sets typed value', () => {
      store.dispatch(typeInput({ field: Field.CURRENCY_A, typedValue: '1.0', noLiquidity: false }))
      expect(store.getState()).toEqual({
        ...initialState,
        independentField: Field.CURRENCY_A,
        typedValue: '1.0',
        otherTypedValue: '',
      })
    })
    it('clears other value', () => {
      store.dispatch(typeInput({ field: Field.CURRENCY_A, typedValue: '1.0', noLiquidity: false }))
      store.dispatch(typeInput({ field: Field.CURRENCY_B, typedValue: '1.0', noLiquidity: false }))
      expect(store.getState()).toEqual({
        ...initialState,
        independentField: Field.CURRENCY_B,
        typedValue: '1.0',
        otherTypedValue: '',
      })
    })
  })
})

import { createStore, Store } from 'redux'

import { Field, typeInput } from './actions'
import reducer, { MintState } from './reducer'

describe('mint reducer', () => {
  let store: Store<MintState>

  beforeEach(() => {
    store = createStore(reducer, {
      independentField: Field.CURRENCY_A,
      typedValue: '',
      otherTypedValue: ''
    })
  })

  describe('typeInput', () => {
    it('sets typed value', () => {
      store.dispatch(typeInput({ field: Field.CURRENCY_A, typedValue: '1.0', noLiquidity: false }))
      expect(store.getState()).toEqual({ independentField: Field.CURRENCY_A, typedValue: '1.0', otherTypedValue: '' })
    })
    it('clears other value', () => {
      store.dispatch(typeInput({ field: Field.CURRENCY_A, typedValue: '1.0', noLiquidity: false }))
      store.dispatch(typeInput({ field: Field.CURRENCY_B, typedValue: '1.0', noLiquidity: false }))
      expect(store.getState()).toEqual({ independentField: Field.CURRENCY_B, typedValue: '1.0', otherTypedValue: '' })
    })
  })
})

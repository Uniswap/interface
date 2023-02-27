import { createReducer } from '@reduxjs/toolkit'

import { Field, selectCurrency } from './actions'

interface PairState {
  readonly [Field.CURRENCY_A]: { readonly currencyId: string | undefined }
  readonly [Field.CURRENCY_B]: { readonly currencyId: string | undefined }
}

const initialState: PairState = {
  [Field.CURRENCY_A]: { currencyId: '' },
  [Field.CURRENCY_B]: { currencyId: '' },
}

export default createReducer<PairState>(initialState, builder =>
  builder.addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
    return {
      ...state,
      [field]: { currencyId: currencyId },
    }
  }),
)

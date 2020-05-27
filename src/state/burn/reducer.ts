import { createReducer } from '@reduxjs/toolkit'

import { Field, typeInput } from './actions'
import { setDefaultsFromURLMatchParams } from '../mint/actions'
import { parseTokens } from '../mint/reducer'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.TOKEN_A]: {
    readonly address: string
  }
  readonly [Field.TOKEN_B]: {
    readonly address: string
  }
}

const initialState: MintState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0',
  [Field.TOKEN_A]: {
    address: ''
  },
  [Field.TOKEN_B]: {
    address: ''
  }
}

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURLMatchParams, (state, { payload: { chainId, params } }) => {
      const tokens = parseTokens(chainId, params?.tokens ?? '')
      return {
        independentField: Field.LIQUIDITY_PERCENT,
        typedValue: '0',
        [Field.TOKEN_A]: {
          address: tokens[0]
        },
        [Field.TOKEN_B]: {
          address: tokens[1]
        }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
)

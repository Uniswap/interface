import { createReducer } from '@reduxjs/toolkit'
import { ChainId, WETH } from '@uniswap/sdk'

import { isAddress } from '../../utils'
import { Field, setDefaultsFromURLMatchParams, selectToken, typeInput } from './actions'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly otherTypedValue: string // for the case when there's no liquidity
  readonly [Field.TOKEN_A]: {
    readonly address: string
  }
  readonly [Field.TOKEN_B]: {
    readonly address: string
  }
}

const initialState: MintState = {
  independentField: Field.TOKEN_A,
  typedValue: '',
  otherTypedValue: '',
  [Field.TOKEN_A]: {
    address: ''
  },
  [Field.TOKEN_B]: {
    address: ''
  }
}

function parseTokens(chainId: number, tokens: string): string[] {
  return (
    tokens
      // split by '-', if one exists
      .split('-')
      // add an empty element for the case where the array from split is only length 1
      .concat([''])
      // only consider the first 2 elements
      .slice(0, 2)
      .map((token): string =>
        isAddress(token)
          ? token
          : token.toLowerCase() === 'ETH'.toLowerCase()
          ? WETH[chainId as ChainId]?.address ?? ''
          : ''
      )
  )
}

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURLMatchParams, (state, { payload: { chainId, params } }) => {
      const tokens = parseTokens(chainId, params?.tokens ?? '')
      return {
        ...state,
        [Field.TOKEN_A]: {
          address: tokens[0]
        },
        [Field.TOKEN_B]: {
          address: tokens[1]
        }
      }
    })
    .addCase(selectToken, (state, { payload: { address, field } }) => {
      const otherField = field === Field.TOKEN_A ? Field.TOKEN_B : Field.TOKEN_A
      if (address === state[otherField].address) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.TOKEN_A ? Field.TOKEN_B : Field.TOKEN_A,
          [field]: { address },
          [otherField]: { address: state[field].address }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { address }
        }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue
          }
        }
        // they're typing into a new field, store the other value
        else {
          return {
            ...state,
            independentField: field,
            typedValue,
            otherTypedValue: state.typedValue
          }
        }
      } else {
        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: ''
        }
      }
    })
)

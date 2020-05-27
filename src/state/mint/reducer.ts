import { createReducer } from '@reduxjs/toolkit'
import { ChainId, WETH } from '@uniswap/sdk'

import { isAddress } from '../../utils'
import { Field, setDefaultsFromURLMatchParams, typeInput } from './actions'

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

export function parseTokens(chainId: number, tokens: string): string[] {
  return (
    tokens
      // split by '-'
      .split('-')
      // map to addresses
      .map((token): string =>
        isAddress(token)
          ? token
          : token.toLowerCase() === 'ETH'.toLowerCase()
          ? WETH[chainId as ChainId]?.address ?? ''
          : ''
      )
      //remove duplicates
      .filter((token, i, array) => array.indexOf(token) === i)
      // add two empty elements for cases where the array is length 0
      .concat(['', ''])
      // only consider the first 2 elements
      .slice(0, 2)
  )
}

export default createReducer<MintState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURLMatchParams, (state, { payload: { chainId, params } }) => {
      const tokens = parseTokens(chainId, params?.tokens ?? '')
      return {
        independentField: Field.TOKEN_A,
        typedValue: '',
        otherTypedValue: '',
        [Field.TOKEN_A]: {
          address: tokens[0]
        },
        [Field.TOKEN_B]: {
          address: tokens[1]
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

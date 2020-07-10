import { createReducer } from '@reduxjs/toolkit'
import { ChainId, WETH } from '@uniswap/sdk'
import { isAddress } from '../../utils'

import { Field, setBurnDefaultsFromURLMatchParams, typeInput } from './actions'

export interface BurnState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.TOKEN_A]: {
    readonly address: string
  }
  readonly [Field.TOKEN_B]: {
    readonly address: string
  }
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0',
  [Field.TOKEN_A]: {
    address: ''
  },
  [Field.TOKEN_B]: {
    address: ''
  }
}

export function parseTokens(chainId: ChainId, tokens: string): string[] {
  return (
    tokens
      // split by '-'
      .split('-')
      // map to addresses
      .map((token): string =>
        isAddress(token) ? token : token.toLowerCase() === 'ETH'.toLowerCase() ? WETH[chainId]?.address ?? '' : ''
      )
      //remove duplicates
      .filter((token, i, array) => array.indexOf(token) === i)
      // add two empty elements for cases where the array is length 0
      .concat(['', ''])
      // only consider the first 2 elements
      .slice(0, 2)
  )
}

export default createReducer<BurnState>(initialState, builder =>
  builder
    .addCase(setBurnDefaultsFromURLMatchParams, (state, { payload: { chainId, params } }) => {
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

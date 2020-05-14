import { parse } from 'qs'
import { createReducer } from '@reduxjs/toolkit'
import { WETH } from '@uniswap/sdk'
import { Field, selectToken, setDefaultsFromURL, switchTokens, typeInput } from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly address: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly address: string | undefined
  }
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    address: ''
  },
  [Field.OUTPUT]: {
    address: ''
  }
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURL, (state, { payload: { queryString, chainId } }) => {
      if (queryString && queryString.length > 1) {
        const result = parse(queryString.substr(1), { parseArrays: false })
        return {
          [Field.INPUT]: {
            address: result.inputToken === 'ETH' ? WETH[chainId]?.address : ''
          },
          [Field.OUTPUT]: {
            address: result.outputToken === 'ETH' && result.inputToken !== 'ETH' ? WETH[chainId]?.address : ''
          },
          typedValue: typeof result.amount === 'string' ? result.amount : '',
          independentField: result.exact === 'out' ? Field.OUTPUT : Field.INPUT
        }
      }

      return {
        ...initialState,
        [Field.INPUT]: {
          address: WETH[chainId]?.address
        }
      }
    })
    .addCase(selectToken, (state, { payload: { address, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (address === state[otherField].address) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
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
    .addCase(switchTokens, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { address: state[Field.OUTPUT].address },
        [Field.OUTPUT]: { address: state[Field.INPUT].address }
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

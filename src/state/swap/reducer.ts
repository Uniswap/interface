import { parse } from 'qs'
import { createReducer } from '@reduxjs/toolkit'
import { WETH } from '@uniswap/sdk'
import { isAddress } from '../../utils'
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

function parseTokenURL(input: any, chainId: number): string {
  if (typeof input !== 'string') return ''
  const valid = isAddress(input)
  if (valid) return valid
  if (input.toLowerCase() === 'eth') return WETH[chainId]?.address ?? ''
  return ''
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURL, (state, { payload: { queryString, chainId } }) => {
      if (queryString && queryString.length > 1) {
        const result = parse(queryString.substr(1), { parseArrays: false })
        const inToken = parseTokenURL(result.inputToken, chainId)
        const outToken = parseTokenURL(result.outputToken, chainId)
        return {
          [Field.INPUT]: {
            address: inToken
          },
          [Field.OUTPUT]: {
            address: inToken === outToken ? '' : outToken
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

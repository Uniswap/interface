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

function parseCurrencyFromURLParameter(urlParam: any, chainId: number): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    if (urlParam.toLowerCase() === 'eth') return WETH[chainId]?.address ?? ''
    if (valid === false) return WETH[chainId]?.address ?? ''
  }

  return WETH[chainId]?.address
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(setDefaultsFromURL, (state, { payload: { queryString, chainId } }) => {
      if (queryString && queryString.length > 1) {
        const parsedQs = parse(queryString.substr(1), { parseArrays: false })

        let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency, chainId)
        let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency, chainId)
        if (inputCurrency === outputCurrency) {
          if (typeof parsedQs.outputCurrency === 'string') {
            inputCurrency = ''
          } else {
            outputCurrency = ''
          }
        }

        return {
          [Field.INPUT]: {
            address: inputCurrency
          },
          [Field.OUTPUT]: {
            address: outputCurrency
          },
          typedValue: parseTokenAmountURLParameter(parsedQs.exactAmount),
          independentField: parseIndependentFieldURLParameter(parsedQs.exactField)
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

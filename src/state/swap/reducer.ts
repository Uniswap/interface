import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectToken, switchTokens, typeInput, setSwapFee } from './actions'
import { Pair, Token, ChainId } from 'dxswap-sdk'
import { useActiveWeb3React } from '../../hooks'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly address: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly address: string | undefined
  },
  readonly protocolFeeDenominator: number,
  readonly swapFee: number
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    address: ''
  },
  [Field.OUTPUT]: {
    address: ''
  },
  swapFee: 30,
  protocolFeeDenominator: 5
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(replaceSwapState, (state, { payload: { typedValue, field, inputTokenAddress, outputTokenAddress, protocolFeeDenominator, swapFee } }) => {
      return {
        [Field.INPUT]: {
          address: inputTokenAddress
        },
        [Field.OUTPUT]: {
          address: outputTokenAddress
        },
        independentField: field,
        typedValue: typedValue,
        protocolFeeDenominator: protocolFeeDenominator ? protocolFeeDenominator : 5,
        swapFee: swapFee ? swapFee : 30
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
    .addCase(setSwapFee, (state, { payload: { swapFee, protocolFeeDenominator } }) => {
      if (state.swapFee != swapFee){
        console.log('Updating fees in store with', swapFee, protocolFeeDenominator)
        return {
          ...state,
          swapFee: swapFee,
          protocolFeeDenominator: protocolFeeDenominator
        }
      }
    })
)

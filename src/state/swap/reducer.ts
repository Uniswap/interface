import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectToken, switchTokens, typeInput, setSwapFees, setProtocolFee } from './actions'
import { Pair, Token, ChainId, BigintIsh, JSBI, Fees } from 'dxswap-sdk'
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
  readonly swapFees: {
    [key: string] : {
      fee: bigint,
      owner: string 
    }
  } | {},
  readonly protocolFeeDenominator: Number,
  readonly protocolFeeTo: string | undefined
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
  swapFees: {},
  protocolFeeDenominator: Number(0),
  protocolFeeTo: null
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(replaceSwapState, (state, { payload: {
      typedValue, field, inputTokenAddress, outputTokenAddress, swapFees, protocolFeeDenominator, protocolFeeTo
     } }) => {
      return {
        [Field.INPUT]: {
          address: inputTokenAddress
        },
        [Field.OUTPUT]: {
          address: outputTokenAddress
        },
        independentField: field,
        typedValue: typedValue,
        swapFees: swapFees ? swapFees : state.swapFees,
        protocolFeeDenominator: protocolFeeDenominator ? protocolFeeDenominator : state.protocolFeeDenominator,
        protocolFeeTo: protocolFeeTo ? protocolFeeTo : state.protocolFeeTo
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
    .addCase(setSwapFees, (state, { payload: { swapFees } }) => {
      console.log('Updating swapFees in store with', swapFees)
      return {
        ...state,
        swapFees
      }
    })
    .addCase(setProtocolFee, (state, { payload: {  protocolFeeDenominator, protocolFeeTo } }) => {
      console.log('Updating protocolFeeDenominator in store with', protocolFeeDenominator, protocolFeeTo)
      return {
        ...state,
        protocolFeeDenominator,
        protocolFeeTo
      }
    })
)

import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectToken, switchTokens, typeInput, setSwapFee, setProtocolFeeDenominator } from './actions'
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
  readonly swapFees: { [key: string] : number }
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
  protocolFeeDenominator: 5
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(replaceSwapState, (state, { payload: { typedValue, field, inputTokenAddress, outputTokenAddress, protocolFeeDenominator, swapFees } }) => {
      return {
        [Field.INPUT]: {
          address: inputTokenAddress
        },
        [Field.OUTPUT]: {
          address: outputTokenAddress
        },
        independentField: field,
        typedValue: typedValue,
        protocolFeeDenominator: protocolFeeDenominator ? protocolFeeDenominator : state.protocolFeeDenominator,
        swapFees: swapFees ? swapFees : state.swapFees
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
    .addCase(setSwapFee, (state, { payload: { pairAddress, swapFee } }) => {
      if (state.swapFees[pairAddress] != swapFee){
        console.log('Updating fees in store with', pairAddress, swapFee)
        state.swapFees[pairAddress] = swapFee
        return state
      }
    })
    //
    // TO DO: Add an updateSwapFees method that will fecth all swapFees and save them
    //
    .addCase(setProtocolFeeDenominator, (state, { payload: {  protocolFeeDenominator } }) => {
      if (state.protocolFeeDenominator != protocolFeeDenominator){
        console.log('Updating protocolFeeDenominator in store with', protocolFeeDenominator)
        return {
          ...state,
          protocolFeeDenominator: protocolFeeDenominator
        }
      }
    })
)

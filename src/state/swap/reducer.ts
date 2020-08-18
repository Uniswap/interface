import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput, setSwapFees, setProtocolFee } from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly swapFees: {
    [key: string] : {
      fee: bigint,
      owner: string 
    }
  } | undefined,
  readonly protocolFeeDenominator: Number | undefined,
  readonly protocolFeeTo: string | undefined
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: ''
  },
  [Field.OUTPUT]: {
    currencyId: ''
  },
  recipient: null,
  swapFees: {},
  protocolFeeDenominator: Number(0),
  protocolFeeTo: null
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId } }) => {
        return {
          ...state,
          [Field.INPUT]: {
            currencyId: inputCurrencyId
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId
          },
          independentField: field,
          typedValue: typedValue,
          recipient
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId }
        }
      }
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId }
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
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)

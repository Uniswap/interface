import { WETH } from '@uniswap/sdk'
import { useReducer } from 'react'
import { useWeb3React } from '../../hooks'
import { QueryParams } from '../../utils'

export enum Field {
  INPUT,
  OUTPUT
}

export interface SwapState {
  independentField: Field
  typedValue: string
  [Field.INPUT]: {
    address: string | undefined
  }
  [Field.OUTPUT]: {
    address: string | undefined
  }
}

export function initializeSwapState({ inputTokenAddress, outputTokenAddress, typedValue, independentField }): SwapState {
  return {
    independentField: independentField,
    typedValue: typedValue,
    [Field.INPUT]: {
      address: inputTokenAddress
    },
    [Field.OUTPUT]: {
      address: outputTokenAddress
    }
  }
}

export enum SwapAction {
  SELECT_TOKEN,
  SWITCH_TOKENS,
  TYPE
}

export interface Payload {
  [SwapAction.SELECT_TOKEN]: {
    field: Field
    address: string
  }
  [SwapAction.SWITCH_TOKENS]: undefined
  [SwapAction.TYPE]: {
    field: Field
    typedValue: string
  }
}

export function reducer(
  state: SwapState,
  action: {
    type: SwapAction
    payload: Payload[SwapAction]
  }
): SwapState {
  switch (action.type) {
    case SwapAction.SELECT_TOKEN: {
      const { field, address } = action.payload as Payload[SwapAction.SELECT_TOKEN]
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
    }
    case SwapAction.SWITCH_TOKENS: {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { address: state[Field.OUTPUT].address },
        [Field.OUTPUT]: { address: state[Field.INPUT].address }
      }
    }
    case SwapAction.TYPE: {
      const { field, typedValue } = action.payload as Payload[SwapAction.TYPE]
      return {
        ...state,
        independentField: field,
        typedValue
      }
    }
    default: {
      throw Error
    }
  }
}

export function useSwapStateReducer(params: QueryParams) {
  const { chainId } = useWeb3React()
  return useReducer(
    reducer,
    {
      independentField: params.outputTokenAddress && !params.inputTokenAddress ? Field.OUTPUT : Field.INPUT,
      inputTokenAddress: params.inputTokenAddress ? params.inputTokenAddress : WETH[chainId].address,
      outputTokenAddress: params.outputTokenAddress ? params.outputTokenAddress : '',
      typedValue:
        params.inputTokenAddress && !params.outputTokenAddress
          ? params.inputTokenAmount
          ? params.inputTokenAmount
          : ''
          : !params.inputTokenAddress && params.outputTokenAddress
          ? params.outputTokenAmount
            ? params.outputTokenAmount
            : ''
          : params.inputTokenAddress && params.outputTokenAddress
            ? params.inputTokenAmount
              ? params.inputTokenAmount
              : ''
            : ''
              ? ''
              : ''
                ? ''
                : ''
    },
    initializeSwapState
  )
}

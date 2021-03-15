import {
  Field,
  selectCurrency,
  typeInput,
  BridgeTransactionStatus,
  tokenTransferPending,
  tokenTransferSuccess,
  confirmTransactionPending,
  updateConfirmationsCount,
  confirmTransactionSuccess,
  confirmTokenTransferPending,
  confirmTokenTransferSuccess,
  transferError,
  selectBridgeDirection
} from './actions'
import { createReducer } from '@reduxjs/toolkit'
import { BridgeDirection } from './hooks'

export interface BridgeState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly bridgeTransactionStatus: BridgeTransactionStatus
  readonly confirmations: number
  readonly bridgeDirection?: BridgeDirection
}

const initialState: BridgeState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: ''
  },
  bridgeTransactionStatus: BridgeTransactionStatus.INITIAL,
  confirmations: 0
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      return {
        ...state,
        [field]: { currencyId: currencyId }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
    .addCase(tokenTransferPending, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.TOKEN_TRANSFER_PENDING
      }
    })
    .addCase(tokenTransferSuccess, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.TOKEN_TRANSFER_SUCCESS
      }
    })
    .addCase(confirmTransactionPending, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.CONFIRMATION_TRANSACTION_PENDING
      }
    })
    .addCase(confirmTransactionSuccess, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.CONFIRMATION_TRANSACTION_SUCCESS
      }
    })
    .addCase(updateConfirmationsCount, (state, { payload: { confirmations } }) => {
      return {
        ...state,
        confirmations
      }
    })
    .addCase(confirmTokenTransferPending, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.CONFIRM_TOKEN_TRANSFER_PENDING
      }
    })
    .addCase(confirmTokenTransferSuccess, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.INITIAL,
        confirmations: 0
      }
    })
    .addCase(transferError, state => {
      return {
        ...state,
        bridgeTransactionStatus: BridgeTransactionStatus.INITIAL,
        confirmations: 0
      }
    })
    .addCase(selectBridgeDirection, (state, { payload: { direction } }) => {
      return {
        ...state,
        bridgeDirection: direction
      }
    })
)

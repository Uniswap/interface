import { createAction } from '@reduxjs/toolkit'
import { BridgeDirection } from './hooks'

export enum Field {
  INPUT = 'INPUT'
}

export enum BridgeTransactionStatus {
  INITIAL,
  TOKEN_TRANSFER_PENDING,
  TOKEN_TRANSFER_SUCCESS,
  CONFIRMATION_TRANSACTION_PENDING,
  CONFIRMATION_TRANSACTION_SUCCESS,
  CONFIRM_TOKEN_TRANSFER_PENDING,
  CONFIRM_TOKEN_TRANSFER_SUCCESS
}

export const selectCurrency = createAction<{ field: Field; currencyId: string | undefined }>('bridge/selectCurrency')
export const typeInput = createAction<{ field: Field; typedValue: string }>('bridge/typeInput')

export const tokenTransferPending = createAction('bridge/tokenTransferPending')
export const tokenTransferSuccess = createAction('bridge/tokenTransferSuccess')

export const confirmTransactionPending = createAction('bridge/confirmTransactionPending')
export const updateConfirmationsCount = createAction<{ confirmations: number }>('bridge/updateConfirmationsCount')
export const confirmTransactionSuccess = createAction('bridge/confirmTransactionSuccess')

export const confirmTokenTransferPending = createAction('bridge/confirmTokenTransferPending')
export const confirmTokenTransferSuccess = createAction('bridge/confirmTokenTransferSuccess')

export const transferError = createAction('bridge/transferError')

export const selectBridgeDirection = createAction<{ direction: BridgeDirection }>('bridge/selectBridgeDirection')

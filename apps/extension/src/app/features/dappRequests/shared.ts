import type { DappInfo } from 'src/app/features/dapp/store'
import type { DappRequest, ErrorResponse } from 'src/app/features/dappRequests/types/DappRequestTypes'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'

export interface SenderTabInfo {
  id: number
  url: string
  favIconUrl?: string
}

export enum DappRequestStatus {
  Pending = 'pending',
  Confirming = 'confirming',
}

export interface DappRequestStoreItem {
  dappRequest: DappRequest
  senderTabInfo: SenderTabInfo
  dappInfo?: DappInfo
  isSidebarClosed: boolean | undefined
}

type OptionalTransactionFields = {
  transactionTypeInfo?: TransactionTypeInfo
  preSignedTransaction?: SignedTransactionRequest
}

export type DappRequestNoDappInfo = Omit<DappRequestStoreItem, 'dappInfo'> & OptionalTransactionFields
export type DappRequestWithDappInfo = Required<DappRequestStoreItem> & OptionalTransactionFields
export interface DappRequestRejectParams {
  errorResponse: ErrorResponse
  senderTabInfo: SenderTabInfo
}

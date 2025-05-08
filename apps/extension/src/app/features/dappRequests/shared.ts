import type { DappInfo } from 'src/app/features/dapp/store'
import type { DappRequest, ErrorResponse } from 'src/app/features/dappRequests/types/DappRequestTypes'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

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

type OptionalTransactionTypeInfo = {
  transactionTypeInfo?: TransactionTypeInfo
}

export type DappRequestNoDappInfo = Omit<DappRequestStoreItem, 'dappInfo'> & OptionalTransactionTypeInfo
export type DappRequestWithDappInfo = Required<DappRequestStoreItem> & OptionalTransactionTypeInfo
export interface DappRequestRejectParams {
  errorResponse: ErrorResponse
  senderTabInfo: SenderTabInfo
}

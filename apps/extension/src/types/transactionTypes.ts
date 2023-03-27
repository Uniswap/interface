import { Message, RequestType } from './messageTypes'

export interface TransactionWindowResponse extends Message {
  type: RequestType.ConfirmTransaction | RequestType.RejectTransaction
  transactionId: string
}

export interface TransactionWindowDisplay extends Message {
  type: RequestType.TransactionWindowDisplay
  transactionType: TransactionType
  transactionId: string
  title: string
  message: string
}

export enum TransactionType {
  SwapApproval = 'SwapApproval',
  SendApproval = 'SendApproval',
  Approve = 'Approve',
}

export type TransactionDetails = {
  type: TransactionType.SwapApproval
  id: string
  title: string
  message: string
}

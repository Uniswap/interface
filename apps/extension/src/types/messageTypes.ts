import { ethers } from 'ethers'

/**
 * Base types
 **/

export interface Message {
  type: RequestType | ResponseType
}

export interface Request extends Message {
  requestId: string
}

export enum RequestType {
  GetLocalStorage = 'getLocalStorage',
  SetLocalStorage = 'setLocalStorage',
  SendTransaction = 'sendTransaction',
  UndoTransaction = 'undoTransaction',
  UpdateIcon = 'updateIcon',
  UpdateNotifications = 'UpdateNotifications',
  ViewNotificationData = 'ViewNotificationData',
  SignMessage = 'SignMessage',
  SignTransaction = 'SignTransaction',
  SignedTransaction = 'SignedTransaction',
  ValidatePassword = 'ValidatePassword',
  ConfirmTransaction = 'ConfirmTransaction',
  RejectTransaction = 'RejectTransaction',
  TransactionWindowDisplay = 'TransactionWindowDisplay',
}

export enum ResponseType {
  SignTransactionResponse = 'SignTransactionResponse',
  SendTransactionResponse = 'SendTransactionResponse',
  SignMessageResponse = 'SignMessageResponse',
  ValidatePasswordResponse = 'ValidatePasswordResponse',
}

/* Content script request types */

export interface SignMessageRequest extends Request {
  type: RequestType.SignMessage
  messageHex: string
}

export interface SignTransactionRequest extends Request {
  type: RequestType.SignTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface SendTransactionRequest extends Request {
  type: RequestType.SendTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface ValidatePasswordRequest extends Request {
  type: RequestType.ValidatePassword
  passwordAttempt: string
}

/* Content script response types */

export interface SignMessageResponse extends Message {
  type: ResponseType.SignMessageResponse
  signedMessage?: string
}

export interface SignTransactionResponse extends Message {
  type: ResponseType.SignTransactionResponse
  signedTransactionHash?: string
}

export interface SendTransactionResponse extends Message {
  type: ResponseType.SendTransactionResponse
  transaction?: ethers.providers.TransactionResponse
}

export interface ValidatePasswordResponse extends Message {
  type: ResponseType.ValidatePasswordResponse
  isValid?: ArrayBuffer
}

/**
 * Content script request and response mappings
 **/

// New message types should be added here, and mapped to the corresponding response type
export const contentScriptRequestToResponseMap = new Map<
  RequestType,
  ResponseType
>([
  [RequestType.SendTransaction, ResponseType.SendTransactionResponse],
  [RequestType.SignTransaction, ResponseType.SignTransactionResponse],
  [RequestType.SignMessage, ResponseType.SignMessageResponse],
])

export type ContentScriptRequest =
  | SendTransactionRequest
  | SignTransactionRequest
  | SignMessageRequest

export type ContentScriptResponse =
  | SignMessageResponse
  | SignTransactionResponse
  | SendTransactionResponse

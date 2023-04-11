import { ethers } from 'ethers'

/**
 * Base types
 **/

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Message {}

export interface BaseDappRequest extends Message {
  requestId: string
  type: DappRequestType
}

export interface BaseDappResponse extends Message {
  requestId: string // should match the requestId of the DappRequest
  type: DappResponseType
}

export enum DappRequestType {
  Connect = 'Connect',
  ChangeChain = 'ChangeChain',
  GetAccount = 'GetAccount',
  SendTransaction = 'SendTransaction',
  SignMessage = 'SignMessage',
  SignTransaction = 'SignTransaction',
}

export enum DappResponseType {
  AccountResponse = 'AccountResponse',
  ChainChange = 'ChainChangeResponse',
  HandleConnectResponse = 'HandleConnectResponse',
  SignTransactionResponse = 'SignTransactionResponse',
  SendTransactionResponse = 'SendTransactionResponse',
  SignMessageResponse = 'SignMessageResponse',
  TransactionRejected = 'TransactionRejected',
}

/* Content script request types */

export interface SignMessageRequest extends BaseDappRequest {
  type: DappRequestType.SignMessage
  messageHex: string
}

export interface SignTransactionRequest extends BaseDappRequest {
  type: DappRequestType.SignTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface SendTransactionRequest extends BaseDappRequest {
  type: DappRequestType.SendTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface ConnectRequest extends BaseDappRequest {
  type: DappRequestType.Connect
  chainId: string
}
export interface ChangeChainRequest extends BaseDappRequest {
  type: DappRequestType.ChangeChain
  chainId: string
}

export interface GetAccountRequest extends BaseDappRequest {
  type: DappRequestType.GetAccount
}

/* Content script response types */

export interface SignMessageResponse extends BaseDappResponse {
  type: DappResponseType.SignMessageResponse
  signedMessage?: string
}

export interface SignTransactionResponse extends BaseDappResponse {
  type: DappResponseType.SignTransactionResponse
  signedTransactionHash?: string
}

export interface SendTransactionResponse extends BaseDappResponse {
  type: DappResponseType.SendTransactionResponse
  transaction?: ethers.providers.TransactionResponse
}

export interface TransactionRejectedResponse extends BaseDappResponse {
  type: DappResponseType.TransactionRejected
}

export interface ConnectResponse extends BaseDappResponse {
  type: DappResponseType.HandleConnectResponse
  provider: ethers.providers.JsonRpcProvider
}

export interface ChangeChainResponse extends BaseDappResponse {
  type: DappResponseType.ChainChange
  chainId: string
  provider: ethers.providers.JsonRpcProvider
}

export interface AccountResponse extends BaseDappResponse {
  type: DappResponseType.AccountResponse
  accountAddress: string
}

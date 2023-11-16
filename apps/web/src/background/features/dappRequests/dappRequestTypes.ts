import { EthereumRpcError } from 'eth-rpc-errors'
import { ethers } from 'ethers'
import { isValidMessage } from 'src/background/utils/messageUtils'
import { ChainId } from 'wallet/src/constants/chains'

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
  ChangeChain = 'ChangeChain',
  GetAccount = 'GetAccount',
  GetAccountRequest = 'GetAccountRequest',
  SendTransaction = 'SendTransaction',
  SignMessage = 'SignMessage',
  SignTransaction = 'SignTransaction',
  SignTypedData = 'SignTypedData',
}

export enum DappResponseType {
  AccountResponse = 'AccountResponse',
  ChainChangeResponse = 'ChainChangeResponse',
  ErrorResponse = 'ErrorResponse',
  SignTransactionResponse = 'SignTransactionResponse',
  SendTransactionResponse = 'SendTransactionResponse',
  SignTypedDataResponse = 'SignTypedDataResponse',
  SignMessageResponse = 'SignMessageResponse',
}

export interface ErrorResponse extends BaseDappResponse {
  type: DappResponseType.ErrorResponse
  error: EthereumRpcError<unknown>
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return isValidMessage<ErrorResponse>([DappResponseType.ErrorResponse], response)
}

/* Content script request types */

export interface SignMessageRequest extends BaseDappRequest {
  type: DappRequestType.SignMessage
  messageHex: string
}

export interface SignTypedDataRequest extends BaseDappRequest {
  type: DappRequestType.SignTypedData
  typedData: string
}

export interface SignTransactionRequest extends BaseDappRequest {
  type: DappRequestType.SignTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface SendTransactionRequest extends BaseDappRequest {
  type: DappRequestType.SendTransaction
  transaction: ethers.providers.TransactionRequest
}

export interface ChangeChainRequest extends BaseDappRequest {
  type: DappRequestType.ChangeChain
  chainId: ChainId
}

export interface GetAccountRequest extends BaseDappRequest {
  type: DappRequestType.GetAccount | DappRequestType.GetAccountRequest
}

/* Content script response types */

export interface SignMessageResponse extends BaseDappResponse {
  type: DappResponseType.SignMessageResponse
  signature?: string
}

export interface SignTypedDataResponse extends BaseDappResponse {
  type: DappResponseType.SignTypedDataResponse
  signature: string
}

export interface SignTransactionResponse extends BaseDappResponse {
  type: DappResponseType.SignTransactionResponse
  signedTransactionHash?: string
}

export interface SendTransactionResponse extends BaseDappResponse {
  type: DappResponseType.SendTransactionResponse
  transaction?: ethers.providers.TransactionResponse
}

export interface ChangeChainResponse extends BaseDappResponse {
  type: DappResponseType.ChainChangeResponse
  chainId: ChainId
  providerUrl: string
}

export interface AccountResponse extends BaseDappResponse {
  type: DappResponseType.AccountResponse
  connectedAddresses: Address[]
  chainId: ChainId // current chain id
  providerUrl: string // provider url of the chain for the current chain
}

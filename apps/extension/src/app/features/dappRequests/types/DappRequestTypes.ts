/* eslint-disable import/no-unused-modules */
import { EthereumRpcErrorSchema } from 'src/app/features/dappRequests/types/ErrorTypes'
import { EthersTransactionRequestSchema } from 'src/app/features/dappRequests/types/EthersTypes'
import { NonfungiblePositionManagerCallSchema } from 'src/app/features/dappRequests/types/NonfungiblePositionManagerTypes'
import { UniversalRouterCallSchema } from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import { HomeTabs } from 'src/app/navigation/constants'
import { PermissionRequestSchema, PermissionSchema } from 'src/contentScript/WindowEthereumRequestTypes'
import { MessageSchema } from 'uniswap/src/extension/messagePassing/messageTypes'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import {
  BatchIdSchema,
  CallSchema,
  CapabilitySchema,
  GetCallsStatusResultSchema,
  SendCallsResultSchema,
} from 'wallet/src/features/dappRequests/types'
import { z } from 'zod'

// SCHEMAS + TYPES

const BaseDappRequestSchema = MessageSchema.extend({
  requestId: z.string(),
  type: z.nativeEnum(DappRequestType),
})

const BaseDappResponseSchema = MessageSchema.extend({
  requestId: z.string(),
  type: z.nativeEnum(DappResponseType),
})

export const SignMessageRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.SignMessage),
  messageHex: z.string(),
  address: z.string(),
})
export type SignMessageRequest = z.infer<typeof SignMessageRequestSchema>

export const SignTypedDataRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.SignTypedData),
  typedData: z.string(),
  address: z.string(),
})
export type SignTypedDataRequest = z.infer<typeof SignTypedDataRequestSchema>

export const SignTransactionRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.SignTransaction),
  transaction: EthersTransactionRequestSchema,
})
export type SignTransactionRequest = z.infer<typeof SignTransactionRequestSchema>

export const UniswapOpenSidebarRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.UniswapOpenSidebar),
  tab: z.nativeEnum(HomeTabs).optional(),
})
export type UniswapOpenSidebarRequest = z.infer<typeof UniswapOpenSidebarRequestSchema>

// ENUMS
export enum EthSendTransactionRPCActions {
  Approve = 'Approve',
  Permit2Approve = 'Permit2Approve',
  ContractInteraction = 'ContractInteraction',
  Swap = 'Swap',
  Wrap = 'Wrap',
  LP = 'LP',
  Unknown = 'Unknown',
}

export const BaseSendTransactionRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.SendTransaction),
  transaction: EthersTransactionRequestSchema,
  functionSignature: z.string().optional(),
  contractInteractions: z.nativeEnum(EthSendTransactionRPCActions).optional(),
})
export type BaseSendTransactionRequest = z.infer<typeof BaseSendTransactionRequestSchema>

const ApproveSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.Approve),
})
export type ApproveSendTransactionRequest = z.infer<typeof ApproveSendTransactionRequestSchema>

const Permit2ApproveSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.Permit2Approve),
})
export type Permit2ApproveSendTransactionRequest = z.infer<typeof Permit2ApproveSendTransactionRequestSchema>

const ContractInteractionSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.ContractInteraction),
})

const SwapSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.Swap),
  parsedCalldata: UniversalRouterCallSchema,
})
export type SwapSendTransactionRequest = z.infer<typeof SwapSendTransactionRequestSchema>

const WrapSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.Wrap),
})
export type WrapSendTransactionRequest = z.infer<typeof WrapSendTransactionRequestSchema>

const LPSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.LP),
  parsedCalldata: NonfungiblePositionManagerCallSchema,
})
export type LPSendTransactionRequest = z.infer<typeof LPSendTransactionRequestSchema>

const UnknownContractInteractionSendTransactionRequestSchema = BaseSendTransactionRequestSchema.extend({
  contractInteractions: z.literal(EthSendTransactionRPCActions.Unknown).optional(),
})

export const SendTransactionRequestSchema = z.union([
  ApproveSendTransactionRequestSchema,
  Permit2ApproveSendTransactionRequestSchema,
  ContractInteractionSendTransactionRequestSchema,
  SwapSendTransactionRequestSchema,
  WrapSendTransactionRequestSchema,
  LPSendTransactionRequestSchema,
  UnknownContractInteractionSendTransactionRequestSchema,
])

export type SendTransactionRequest = z.infer<typeof SendTransactionRequestSchema>

export const ChangeChainRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.ChangeChain),
  chainId: z.string(),
})
export type ChangeChainRequest = z.infer<typeof ChangeChainRequestSchema>

export const GetAccountRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.GetAccount),
})
export type GetAccountRequest = z.infer<typeof GetAccountRequestSchema>

export const RequestAccountRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.RequestAccount),
})
export type RequestAccountRequest = z.infer<typeof RequestAccountRequestSchema>

export const GetChainIdRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.GetChainId),
})
export type GetChainIdRequest = z.infer<typeof GetChainIdRequestSchema>

export const GetPermissionsRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.GetPermissions),
})

export type GetPermissionsRequest = z.infer<typeof GetPermissionsRequestSchema>

export const RequestPermissionsRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.RequestPermissions),
  permissions: PermissionRequestSchema,
})

export type RequestPermissionsRequest = z.infer<typeof RequestPermissionsRequestSchema>

export const RevokePermissionsRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.RevokePermissions),
  permissions: PermissionRequestSchema,
})

export type RevokePermissionsRequest = z.infer<typeof RevokePermissionsRequestSchema>

export const SignMessageResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.SignMessageResponse),
  signature: z.string().optional(),
})
export type SignMessageResponse = z.infer<typeof SignMessageResponseSchema>

export const SignTypedDataResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.SignTypedDataResponse),
  signature: z.string(),
})
export type SignTypedDataResponse = z.infer<typeof SignTypedDataResponseSchema>

export const SignTransactionResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.SignTransactionResponse),
  signedTransactionHash: z.string().optional(),
})
export type SignTransactionResponse = z.infer<typeof SignTransactionResponseSchema>

export const SendTransactionResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.SendTransactionResponse),
  transactionHash: z.string(),
})
export type SendTransactionResponse = z.infer<typeof SendTransactionResponseSchema>

export const ChangeChainResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.ChainChangeResponse),
  chainId: z.string(),
  providerUrl: z.string(),
})
export type ChangeChainResponse = z.infer<typeof ChangeChainResponseSchema>

export const AccountResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.AccountResponse),
  connectedAddresses: z.array(z.string()),
  chainId: z.string(),
  providerUrl: z.string(),
})
export type AccountResponse = z.infer<typeof AccountResponseSchema>

export const ChainIdResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.ChainIdResponse),
  chainId: z.string(),
})
export type ChainIdResponse = z.infer<typeof ChainIdResponseSchema>

export const GetPermissionsResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.GetPermissionsResponse),
  permissions: z.array(PermissionSchema),
})
export type GetPermissionsResponse = z.infer<typeof GetPermissionsResponseSchema>

export const RequestPermissionsResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.RequestPermissionsResponse),
  permissions: z.array(PermissionSchema),
  accounts: z.optional(AccountResponseSchema.omit({ requestId: true, type: true })),
})
export type RequestPermissionsResponse = z.infer<typeof RequestPermissionsResponseSchema>

export const RevokePermissionsResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.RevokePermissionsResponse),
})
export type RevokePermissionsResponse = z.infer<typeof RevokePermissionsResponseSchema>

export const UniswapOpenSidebarResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.UniswapOpenSidebarResponse),
})
export type UniswapOpenSidebarResponse = z.infer<typeof UniswapOpenSidebarResponseSchema>

export const ErrorResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.ErrorResponse),
  error: EthereumRpcErrorSchema,
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

const ParsedCallSchema = CallSchema.extend({
  functionSignature: z.string().optional(),
  contractInteractions: z.nativeEnum(EthSendTransactionRPCActions).optional(),
  parsedCalldata: UniversalRouterCallSchema.optional(),
})
export type ParsedCall = z.infer<typeof ParsedCallSchema>

export const SendCallsRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.SendCalls),
  version: z.string(),
  id: BatchIdSchema.optional(),
  from: z.string().optional(),
  chainId: z.string(),
  calls: z.array(z.union([CallSchema, ParsedCallSchema])),
  capabilities: z.record(z.string(), CapabilitySchema).optional(),
})
export type SendCallsRequest = z.infer<typeof SendCallsRequestSchema>

export const GetCallsStatusRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.GetCallsStatus),
  batchId: z.string(),
})
export type GetCallsStatusRequest = z.infer<typeof GetCallsStatusRequestSchema>

export const SendCallsResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.SendCallsResponse),
  response: SendCallsResultSchema,
})
export type SendCallsResponse = z.infer<typeof SendCallsResponseSchema>

export const GetCallsStatusResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.GetCallsStatusResponse),
  response: GetCallsStatusResultSchema,
})
export type GetCallsStatusResponse = z.infer<typeof GetCallsStatusResponseSchema>

export const GetCapabilitiesRequestSchema = BaseDappRequestSchema.extend({
  type: z.literal(DappRequestType.GetCapabilities),
  chainIds: z.array(z.string()).optional(),
  address: z.string(),
})
export type GetCapabilitiesRequest = z.infer<typeof GetCapabilitiesRequestSchema>

export const GetCapabilitiesResponseSchema = BaseDappResponseSchema.extend({
  type: z.literal(DappResponseType.GetCapabilitiesResponse),
  response: z.record(z.string(), CapabilitySchema),
})
export type GetCapabilitiesResponse = z.infer<typeof GetCapabilitiesResponseSchema>

const BatchedSwapSendTransactionRequestSchema = SendCallsRequestSchema.extend({
  calls: z.array(ParsedCallSchema).refine(
    (calls) =>
      calls.filter((call) => {
        const parsedCallResult = ParsedCallSchema.safeParse(call)
        return (
          parsedCallResult.success && parsedCallResult.data.contractInteractions === EthSendTransactionRPCActions.Swap
        )
      }).length === 1,
    {
      message: 'Exactly one call must have contractInteractions set to Swap',
    },
  ),
})
export type BatchedSwapSendTransactionRequest = z.infer<typeof BatchedSwapSendTransactionRequestSchema>

export const DappRequestSchema = z.union([
  ChangeChainRequestSchema,
  GetAccountRequestSchema,
  GetChainIdRequestSchema,
  GetPermissionsRequestSchema,
  RequestAccountRequestSchema,
  RequestPermissionsRequestSchema,
  RevokePermissionsRequestSchema,
  SendTransactionRequestSchema,
  SignMessageRequestSchema,
  SignTypedDataRequestSchema,
  SignTransactionRequestSchema,
  UniswapOpenSidebarRequestSchema,
  SendCallsRequestSchema,
  GetCallsStatusRequestSchema,
  GetCapabilitiesRequestSchema,
])

const DappResponseSchema = z.union([
  AccountResponseSchema,
  ChangeChainResponseSchema,
  ChainIdResponseSchema,
  ErrorResponseSchema,
  GetPermissionsResponseSchema,
  RequestPermissionsResponseSchema,
  SignMessageResponseSchema,
  SignTypedDataResponseSchema,
  SignTransactionResponseSchema,
  SendTransactionResponseSchema,
  UniswapOpenSidebarResponseSchema,
  SendCallsResponseSchema,
  GetCallsStatusResponseSchema,
  GetCapabilitiesResponseSchema,
])

export type DappRequest = z.infer<typeof DappRequestSchema>
type DappResponse = z.infer<typeof DappResponseSchema>

// VALIDATORS / UTILS

export function isValidDappRequest(message: unknown): message is DappRequest {
  return DappRequestSchema.safeParse(message).success
}

export function isValidDappResponse(message: unknown): message is DappResponse {
  return DappResponseSchema.safeParse(message).success
}

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return ErrorResponseSchema.safeParse(response).success
}

export function isValidSendTransactionResponse(response: unknown): response is SendTransactionResponse {
  return SendTransactionResponseSchema.safeParse(response).success
}

export function isValidSignTransactionResponse(response: unknown): response is SignTransactionResponse {
  return SignTransactionResponseSchema.safeParse(response).success
}

export function isValidSignMessageResponse(response: unknown): response is SignMessageResponse {
  return SignMessageResponseSchema.safeParse(response).success
}

export function isValidSignTypedDataResponse(response: unknown): response is SignTypedDataResponse {
  return SignTypedDataResponseSchema.safeParse(response).success
}

export function isValidChangeChainResponse(response: unknown): response is ChangeChainResponse {
  return ChangeChainResponseSchema.safeParse(response).success
}

export function isValidChainIdResponse(response: unknown): response is ChainIdResponse {
  return ChainIdResponseSchema.safeParse(response).success
}

export function isValidAccountResponse(response: unknown): response is AccountResponse {
  return AccountResponseSchema.safeParse(response).success
}

export function isValidGetPermissionsResponse(response: unknown): response is GetPermissionsResponse {
  return GetPermissionsResponseSchema.safeParse(response).success
}

export function isValidRequestPermissionsResponse(response: unknown): response is RequestPermissionsResponse {
  return RequestPermissionsResponseSchema.safeParse(response).success
}

export function isApproveRequest(request: SendTransactionRequest): request is ApproveSendTransactionRequest {
  return ApproveSendTransactionRequestSchema.safeParse(request).success
}

export function isPermit2ApproveRequest(
  request: SendTransactionRequest,
): request is Permit2ApproveSendTransactionRequest {
  return Permit2ApproveSendTransactionRequestSchema.safeParse(request).success
}

export function isSwapRequest(request: SendTransactionRequest): request is SwapSendTransactionRequest {
  return SwapSendTransactionRequestSchema.safeParse(request).success
}

export function isBatchedSwapRequest(request: SendCallsRequest): request is BatchedSwapSendTransactionRequest {
  return BatchedSwapSendTransactionRequestSchema.safeParse(request).success
}

export function isSignTypedDataRequest(request: DappRequest): request is SignTypedDataRequest {
  return SignTypedDataRequestSchema.safeParse(request).success
}

export function isChangeChainRequest(request: DappRequest): request is ChangeChainRequest {
  return ChangeChainRequestSchema.safeParse(request).success
}

export function isSignMessageRequest(request: DappRequest): request is SignMessageRequest {
  return SignMessageRequestSchema.safeParse(request).success
}

export function isLPRequest(request: SendTransactionRequest): request is LPSendTransactionRequest {
  return LPSendTransactionRequestSchema.safeParse(request).success
}

export function isSendTransactionRequest(request: DappRequest): request is SendTransactionRequest {
  return SendTransactionRequestSchema.safeParse(request).success
}

export function isGetAccountRequest(request: DappRequest): request is GetAccountRequest {
  return GetAccountRequestSchema.safeParse(request).success
}

export function isRequestAccountRequest(request: DappRequest): request is RequestAccountRequest {
  return RequestAccountRequestSchema.safeParse(request).success
}

export function isRequestPermissionsRequest(request: DappRequest): request is RequestPermissionsRequest {
  return RequestPermissionsRequestSchema.safeParse(request).success
}

export function isConnectionRequest(request: DappRequest): boolean {
  return isGetAccountRequest(request) || isRequestAccountRequest(request) || isRequestPermissionsRequest(request)
}

export function isWrapRequest(request: SendTransactionRequest): request is WrapSendTransactionRequest {
  return WrapSendTransactionRequestSchema.safeParse(request).success
}

export function isSendCallsRequest(request: DappRequest): request is SendCallsRequest {
  return SendCallsRequestSchema.safeParse(request).success
}

export function isGetCallsStatusRequest(request: DappRequest): request is GetCallsStatusRequest {
  return GetCallsStatusRequestSchema.safeParse(request).success
}

export function isValidSendCallsResponse(response: unknown): response is SendCallsResponse {
  return SendCallsResponseSchema.safeParse(response).success
}

export function isValidGetCallsStatusResponse(response: unknown): response is GetCallsStatusResponse {
  return GetCallsStatusResponseSchema.safeParse(response).success
}

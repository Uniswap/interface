/* eslint-disable complexity */
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { PayloadAction } from '@reduxjs/toolkit'
import { getAccount, getAccountRequest } from 'src/app/features/dappRequests/accounts'
import {
  confirmRequest,
  confirmRequestNoDappInfo,
  rejectAllRequests,
  rejectRequest,
} from 'src/app/features/dappRequests/actions'
import { getChainId, getChainIdNoDappInfo } from 'src/app/features/dappRequests/getChainId'
import {
  handleGetPermissionsRequest,
  handleRequestPermissions,
  handleRevokePermissions,
} from 'src/app/features/dappRequests/permissions'
import {
  changeChainSaga,
  handleGetCallsStatus,
  handleGetCapabilities,
  handleSendCalls,
  handleSendTransaction,
  handleSignMessage,
  handleSignTypedData,
  handleUniswapOpenSidebarRequest,
} from 'src/app/features/dappRequests/saga'
import type {
  DappRequestNoDappInfo,
  DappRequestRejectParams,
  DappRequestWithDappInfo,
} from 'src/app/features/dappRequests/shared'
import { dappRequestActions, selectAllDappRequests } from 'src/app/features/dappRequests/slice'
import {
  BaseSendTransactionRequest,
  BaseSendTransactionRequestSchema,
  ChangeChainRequest,
  ChangeChainRequestSchema,
  ErrorResponse,
  GetAccountRequest,
  GetAccountRequestSchema,
  GetCallsStatusRequest,
  GetCallsStatusRequestSchema,
  GetCapabilitiesRequest,
  GetCapabilitiesRequestSchema,
  GetChainIdRequest,
  GetChainIdRequestSchema,
  GetPermissionsRequest,
  GetPermissionsRequestSchema,
  RequestAccountRequest,
  RequestAccountRequestSchema,
  RequestPermissionsRequest,
  RequestPermissionsRequestSchema,
  RevokePermissionsRequest,
  RevokePermissionsRequestSchema,
  SendCallsRequest,
  SendCallsRequestSchema,
  SignMessageRequest,
  SignMessageRequestSchema,
  SignTypedDataRequest,
  SignTypedDataRequestSchema,
  UniswapOpenSidebarRequest,
  UniswapOpenSidebarRequestSchema,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { logger } from 'utilities/src/logger/logger'

function* dappRequestApproval({
  type,
  payload: request,
}: PayloadAction<DappRequestWithDappInfo | DappRequestNoDappInfo | DappRequestRejectParams>) {
  if (type === rejectAllRequests.type) {
    const existingRequests = yield* select(selectAllDappRequests)

    for (const existingRequest of existingRequests) {
      const errorResponse: ErrorResponse = {
        type: DappResponseType.ErrorResponse,
        error: serializeError(providerErrors.userRejectedRequest()),
        requestId: existingRequest.dappRequest.requestId,
      }

      yield* call(dappResponseMessageChannel.sendMessageToTab, existingRequest.senderTabInfo.id, errorResponse)
    }

    yield* put(dappRequestActions.removeAll())
    return
  }

  const requestId =
    ('dappRequest' in request && request.dappRequest.requestId) ||
    ('errorResponse' in request && request.errorResponse.requestId)
  const { id: senderTabId } = request.senderTabInfo

  if (!senderTabId) {
    throw new Error('senderTabId is required')
  }

  if (requestId === false) {
    // Check explicitly for false, since empty requestId string is also falsy.
    // In the latter case, we need to proceed to remove the request from queue.
    throw new Error('requestId is required')
  }

  try {
    if (type === confirmRequest.type) {
      const confirmedRequest = request as DappRequestWithDappInfo
      logger.debug('dappRequestApprovalWatcher', 'confirmRequest', 'confirm request', request)

      switch (confirmedRequest.dappRequest.type) {
        case DappRequestType.RequestPermissions: {
          const validatedRequest: RequestPermissionsRequest = RequestPermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(
            handleRequestPermissions,
            validatedRequest,
            confirmedRequest.senderTabInfo,
            confirmedRequest.dappInfo,
          )
          break
        }
        case DappRequestType.RevokePermissions: {
          const validatedRequest: RevokePermissionsRequest = RevokePermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleRevokePermissions, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.GetPermissions: {
          const validatedRequest: GetPermissionsRequest = GetPermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleGetPermissionsRequest, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        case DappRequestType.SendTransaction: {
          const validatedRequest: BaseSendTransactionRequest = BaseSendTransactionRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleSendTransaction, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
            transactionTypeInfo: confirmedRequest.transactionTypeInfo,
            preSignedTransaction: confirmedRequest.preSignedTransaction,
          })
          break
        }
        case DappRequestType.GetAccount: {
          const validatedRequest: GetAccountRequest = GetAccountRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(getAccount, {
            dappRequest: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        case DappRequestType.RequestAccount: {
          const validatedRequest: RequestAccountRequest = RequestAccountRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(getAccountRequest, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
          break
        }
        case DappRequestType.GetChainId: {
          const validatedRequest: GetChainIdRequest = GetChainIdRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(getChainId, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        case DappRequestType.ChangeChain: {
          const validatedRequest: ChangeChainRequest = ChangeChainRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(changeChainSaga, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
          break
        }
        case DappRequestType.SignMessage: {
          const validatedRequest: SignMessageRequest = SignMessageRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(handleSignMessage, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        case DappRequestType.SignTypedData: {
          const validatedRequest: SignTypedDataRequest = SignTypedDataRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(handleSignTypedData, {
            dappRequest: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        case DappRequestType.GetCapabilities: {
          const validatedRequest: GetCapabilitiesRequest = GetCapabilitiesRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleGetCapabilities, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.SendCalls: {
          const validatedRequest: SendCallsRequest = SendCallsRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(handleSendCalls, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
            transactionTypeInfo: confirmedRequest.transactionTypeInfo,
            preSignedTransaction: confirmedRequest.preSignedTransaction,
          })
          break
        }
        case DappRequestType.GetCallsStatus: {
          const validatedRequest: GetCallsStatusRequest = GetCallsStatusRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleGetCallsStatus, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            dappInfo: confirmedRequest.dappInfo,
          })
          break
        }
        // Add more request types here
      }
    } else if (type === confirmRequestNoDappInfo.type) {
      const confirmedRequest = request as DappRequestNoDappInfo
      switch (confirmedRequest.dappRequest.type) {
        case DappRequestType.RequestAccount: {
          const validatedRequest = RequestAccountRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(getAccountRequest, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.RequestPermissions: {
          const validatedRequest: RequestPermissionsRequest = RequestPermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleRequestPermissions, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.RevokePermissions: {
          const validatedRequest: RevokePermissionsRequest = RevokePermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleRevokePermissions, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.GetPermissions: {
          const validatedRequest: GetPermissionsRequest = GetPermissionsRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleGetPermissionsRequest, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
          })
          break
        }
        case DappRequestType.GetChainId: {
          const validatedRequest: GetChainIdRequest = GetChainIdRequestSchema.parse(confirmedRequest.dappRequest)
          const { defaultChainId } = yield getEnabledChainIdsSaga(Platform.EVM)
          yield* call(getChainIdNoDappInfo, {
            request: validatedRequest,
            senderTabInfo: confirmedRequest.senderTabInfo,
            defaultChainId,
          })
          break
        }
        case DappRequestType.UniswapOpenSidebar: {
          const validatedRequest: UniswapOpenSidebarRequest = UniswapOpenSidebarRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(handleUniswapOpenSidebarRequest, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
      }
    } else if (type === rejectRequest.type) {
      const rejectedRequest = request as DappRequestRejectParams
      logger.debug('dappRequestApprovalWatcher', 'rejectRequest', 'dapp request rejected', request)

      const errorResponse: ErrorResponse = {
        type: DappResponseType.ErrorResponse,
        error: rejectedRequest.errorResponse.error,
        requestId: rejectedRequest.errorResponse.requestId,
      }

      yield* call(dappResponseMessageChannel.sendMessageToTab, rejectedRequest.senderTabInfo.id, errorResponse)
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequestApprovalWatcherSaga', function: 'dappRequestApprovalWatcher' },
    })

    const errorResponse: ErrorResponse = {
      type: DappResponseType.ErrorResponse,
      requestId,
      error: serializeError(error),
    }

    yield* call(dappResponseMessageChannel.sendMessageToTab, senderTabId, errorResponse)
  } finally {
    yield* put(dappRequestActions.remove(requestId))
  }
}

/**
 * Watch for pending requests to be confirmed or rejected and dispatch action
 */
export function* dappRequestApprovalWatcher() {
  yield* takeEvery([confirmRequestNoDappInfo, confirmRequest, rejectRequest, rejectAllRequests], dappRequestApproval)
}

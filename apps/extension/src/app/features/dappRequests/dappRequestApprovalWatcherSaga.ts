/* eslint-disable complexity */
import { providerErrors, serializeError } from '@metamask/rpc-errors'
import { PayloadAction } from '@reduxjs/toolkit'
import { getAccount, getAccountRequest } from 'src/app/features/dappRequests/accounts'
import { getChainId, getChainIdNoDappInfo } from 'src/app/features/dappRequests/getChainId'
import {
  handleGetPermissionsRequest,
  handleRequestPermissions,
  handleRevokePermissions,
} from 'src/app/features/dappRequests/permissions'
import {
  DappRequestNoDappInfo,
  DappRequestRejectParams,
  DappRequestWithDappInfo,
  changeChainSaga,
  confirmRequest,
  confirmRequestNoDappInfo,
  handleSendTransaction,
  handleSignMessage,
  handleSignTypedData,
  handleUniswapOpenSidebarRequest,
  rejectAllRequests,
  rejectRequest,
} from 'src/app/features/dappRequests/saga'
import { dappRequestActions } from 'src/app/features/dappRequests/slice'
import {
  BaseSendTransactionRequest,
  BaseSendTransactionRequestSchema,
  ChangeChainRequest,
  ChangeChainRequestSchema,
  DappRequestType,
  DappResponseType,
  ErrorResponse,
  GetAccountRequest,
  GetAccountRequestSchema,
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
  SignMessageRequest,
  SignMessageRequestSchema,
  SignTypedDataRequest,
  SignTypedDataRequestSchema,
  UniswapOpenSidebarRequest,
  UniswapOpenSidebarRequestSchema,
} from 'src/app/features/dappRequests/types/DappRequestTypes'
import { dappResponseMessageChannel } from 'src/background/messagePassing/messageChannels'
import { ExtensionState } from 'src/store/extensionReducer'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { logger } from 'utilities/src/logger/logger'

function* dappRequestApproval({
  type,
  payload: request,
}: PayloadAction<DappRequestWithDappInfo | DappRequestNoDappInfo | DappRequestRejectParams>) {
  if (type === rejectAllRequests.type) {
    const pendingRequests = yield* select((state: ExtensionState) => state.dappRequests.pending)

    for (const pendingRequest of pendingRequests) {
      const errorResponse: ErrorResponse = {
        type: DappResponseType.ErrorResponse,
        error: serializeError(providerErrors.userRejectedRequest()),
        requestId: pendingRequest.dappRequest.requestId,
      }

      yield* call(dappResponseMessageChannel.sendMessageToTab, pendingRequest.senderTabInfo.id, errorResponse)
    }

    yield* put(dappRequestActions.removeAll())
    return
  }

  const requestId =
    ('dappRequest' in request && request?.dappRequest?.requestId) ||
    ('errorResponse' in request && request?.errorResponse?.requestId)
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
          yield* call(
            handleGetPermissionsRequest,
            validatedRequest,
            confirmedRequest.senderTabInfo,
            confirmedRequest.dappInfo,
          )
          break
        }
        case DappRequestType.SendTransaction: {
          const validatedRequest: BaseSendTransactionRequest = BaseSendTransactionRequestSchema.parse(
            confirmedRequest.dappRequest,
          )
          yield* call(
            handleSendTransaction,
            validatedRequest,
            confirmedRequest.senderTabInfo,
            confirmedRequest.dappInfo,
            confirmedRequest.transactionTypeInfo,
          )
          break
        }
        case DappRequestType.GetAccount: {
          const validatedRequest: GetAccountRequest = GetAccountRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(getAccount, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
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
          yield* call(getChainId, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
          break
        }
        case DappRequestType.ChangeChain: {
          const validatedRequest: ChangeChainRequest = ChangeChainRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(changeChainSaga, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
          break
        }
        case DappRequestType.SignMessage: {
          const validatedRequest: SignMessageRequest = SignMessageRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(handleSignMessage, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
          break
        }
        case DappRequestType.SignTypedData: {
          const validatedRequest: SignTypedDataRequest = SignTypedDataRequestSchema.parse(confirmedRequest.dappRequest)
          yield* call(handleSignTypedData, validatedRequest, confirmedRequest.senderTabInfo, confirmedRequest.dappInfo)
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
          yield* call(handleGetPermissionsRequest, validatedRequest, confirmedRequest.senderTabInfo)
          break
        }
        case DappRequestType.GetChainId: {
          const validatedRequest: GetChainIdRequest = GetChainIdRequestSchema.parse(confirmedRequest.dappRequest)
          const { defaultChainId } = yield getEnabledChainIdsSaga()
          yield* call(getChainIdNoDappInfo, validatedRequest, confirmedRequest.senderTabInfo, defaultChainId)
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

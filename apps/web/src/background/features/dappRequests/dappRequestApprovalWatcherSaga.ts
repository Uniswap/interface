import { sendRejectionToContentScript } from 'src/background/utils/messageUtils'
import { call, put, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ChangeChainRequest, DappRequestType } from './dappRequestTypes'
import {
  changeChain,
  confirmRequest,
  DappRequestRejectedParams,
  getAccount,
  handleSignMessage,
  handleSignTypedData,
  rejectRequest,
  sendTransaction,
} from './saga'
import { dappRequestActions, DappRequestStoreItem } from './slice'

/**
 * Watch for pending requests to be confirmed or rejected and dispatch action
 */
export function* dappRequestApprovalWatcher() {
  while (true) {
    const { type, payload: request } = yield* take<
      ReturnType<typeof confirmRequest> | ReturnType<typeof rejectRequest>
    >([confirmRequest.type, rejectRequest.type])

    try {
      if (type === confirmRequest.type) {
        const confirmedRequest = request as DappRequestStoreItem
        logger.info('dappRequestApprovalWatcher', 'confirmRequest', JSON.stringify(request))

        switch (request.dappRequest.type) {
          case DappRequestType.SendTransaction:
            yield* call(sendTransaction, confirmedRequest)
            break
          case DappRequestType.GetAccount:
          case DappRequestType.GetAccountRequest:
            yield* call(
              getAccount,
              request.dappRequest.requestId,
              request.senderTabId,
              confirmedRequest.dappUrl,
              request.dappRequest.type === DappRequestType.GetAccountRequest
            )
            break
          case DappRequestType.ChangeChain:
            yield* call(
              changeChain,
              request.dappRequest.requestId,
              (request.dappRequest as ChangeChainRequest).chainId,
              request.senderTabId,
              confirmedRequest.dappUrl
            )
            break
          case DappRequestType.SignMessage:
            yield* call(handleSignMessage, confirmedRequest)
            break
          case DappRequestType.SignTypedData:
            yield* call(handleSignTypedData, confirmedRequest)
            break
          // Add more request types here
        }
      } else if (type === rejectRequest.type) {
        logger.info('dappRequestApprovalWatcher', 'rejectRequest', JSON.stringify(request))

        const rejectedRequest = request as DappRequestRejectedParams
        yield* call(
          sendRejectionToContentScript,
          rejectedRequest.error,
          request.dappRequest.requestId,
          request.senderTabId
        )
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'dappRequestApprovalWatcherSaga', function: 'dappRequestApprovalWatcher' },
      })
    } finally {
      yield* put(dappRequestActions.remove(request.dappRequest.requestId))
    }
  }
}

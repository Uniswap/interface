import { sendRejectionToContentScript } from 'src/background/utils/messageUtils'
import { call, put, take } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import {
  ChangeChainRequest,
  ConnectRequest,
  DappRequestType,
  SendTransactionRequest,
  SignMessageRequest,
  SignTypedDataRequest,
} from './dappRequestTypes'
import {
  changeChain,
  confirmRequest,
  connect,
  getAccount,
  handleSignMessage,
  handleSignTypedData,
  rejectRequest,
  sendTransaction,
} from './saga'
import { dappRequestActions } from './slice'

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
        logger.info('dappRequestApprovalWatcher', 'confirmRequest', JSON.stringify(request))

        switch (request.dappRequest.type) {
          case DappRequestType.SendTransaction:
            yield* call(
              sendTransaction,
              (request.dappRequest as SendTransactionRequest).transaction,
              request.account,
              request.dappRequest.requestId,
              request.senderTabId
            )
            break
          case DappRequestType.GetAccount:
            yield* call(getAccount, request.dappRequest.requestId, request.senderTabId)
            break
          case DappRequestType.ChangeChain:
            yield* call(
              changeChain,
              request.dappRequest.requestId,
              (request.dappRequest as ChangeChainRequest).chainId,
              request.senderTabId
            )
            break
          case DappRequestType.Connect:
            yield* call(
              connect,
              request.dappRequest.requestId,
              (request.dappRequest as ConnectRequest).chainId,
              request.senderTabId
            )
            break
          case DappRequestType.SignMessage:
            yield* call(
              handleSignMessage,
              request.account,
              request.dappRequest.requestId,
              (request.dappRequest as SignMessageRequest).messageHex,
              request.senderTabId
            )
            break
          case DappRequestType.SignTypedData:
            yield* call(
              handleSignTypedData,
              request.account,
              request.dappRequest.requestId,
              (request.dappRequest as SignTypedDataRequest).typedData,
              request.senderTabId
            )
            break
          // Add more request types here
        }
      } else if (type === rejectRequest.type) {
        logger.info('dappRequestApprovalWatcher', 'rejectRequest', JSON.stringify(request))
        yield* call(
          sendRejectionToContentScript,
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

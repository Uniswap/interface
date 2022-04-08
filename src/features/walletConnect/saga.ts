import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { getSignerManager } from 'src/app/walletContext'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account } from 'src/features/wallet/accounts/types'
import {
  SessionConnectedEvent,
  SessionDisconnectedEvent,
  SignRequestEvent,
  WCError,
  WCEventType,
} from 'src/features/walletConnect/types'
import { sendSignature } from 'src/features/walletConnect/WalletConnect'
import {
  addRequest,
  addSession,
  removeSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { logger } from 'src/utils/logger'
import { createSaga } from 'src/utils/saga'
import { call, put, take } from 'typed-redux-saga'

function createWalletConnectChannel(wcEventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const sessionConnectedHandler = (req: SessionConnectedEvent) => {
      emit(
        addSession({
          wcSession: { id: req.session_id, dappName: req.session_name },
          account: req.account,
        })
      )
    }

    const sessionDisconnectedHandler = (req: SessionDisconnectedEvent) => {
      emit(removeSession({ sessionId: req.session_id, account: req.account }))
    }

    const signRequestHandler = (req: SignRequestEvent) => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type,
            message: req.message,
            internalId: req.request_internal_id,
            account: req.account,
          },
        })
      )
    }

    const errorHandler = (req: WCError) => {
      logger.error('wcSaga', 'errorHandler', req.type, req.message || '')
    }

    wcEventEmitter.addListener(WCEventType.SessionConnected, sessionConnectedHandler)
    wcEventEmitter.addListener(WCEventType.SessionDisconnected, sessionDisconnectedHandler)
    wcEventEmitter.addListener(WCEventType.SignRequest, signRequestHandler)
    wcEventEmitter.addListener(WCEventType.Error, errorHandler)

    const unsubscribe = () => {
      wcEventEmitter.removeAllListeners(WCEventType.SessionConnected)
      wcEventEmitter.removeAllListeners(WCEventType.SessionDisconnected)
      wcEventEmitter.removeAllListeners(WCEventType.Error)
      wcEventEmitter.removeAllListeners(WCEventType.SignRequest)
    }

    return unsubscribe
  })
}

export function* watchWalletConnectEvents() {
  const wcEvents = new NativeEventEmitter(NativeModules.RNWalletConnect)
  const wcChannel = yield* call(createWalletConnectChannel, wcEvents)

  while (true) {
    try {
      const payload = yield* take(wcChannel)
      yield* put(payload)
    } catch (err) {
      logger.error('wcSaga', 'watchWalletConnectSessions', 'channel error: ', err)
    }
  }
}

type SignMessageParams = {
  requestInternalId: string
  message: string
  account: Account
}

export function* signWcMessage(params: SignMessageParams) {
  const { requestInternalId, message, account } = params
  try {
    const signerManager = yield* call(getSignerManager)
    const signature = yield* call(signMessage, message, account, signerManager)
    yield* call(sendSignature, requestInternalId, signature, account.address)
  } catch (err) {
    logger.error('wcSaga', 'signMessage', 'signing error:', err)
  }
}

async function signMessage(message: string, account: Account, signerManager: SignerManager) {
  const signer = await signerManager.getSignerForAccount(account)
  const signature = await signer.signMessage(message)
  return signature
}

export const { wrappedSaga: signMessageSaga, actions: signMessageActions } = createSaga(
  signWcMessage,
  'signMessage'
)

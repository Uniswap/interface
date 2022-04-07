import { Action } from '@reduxjs/toolkit'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import {
  SessionConnectedEvent,
  SessionDisconnectedEvent,
  WCEventType,
} from 'src/features/walletConnect/types'
import { addSession, removeSession } from 'src/features/walletConnect/walletConnectSlice'
import { logger } from 'src/utils/logger'
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

    wcEventEmitter.addListener(WCEventType.SessionConnected, sessionConnectedHandler)
    wcEventEmitter.addListener(WCEventType.SessionDisconnected, sessionDisconnectedHandler)

    const unsubscribe = () => {
      wcEventEmitter.removeAllListeners(WCEventType.SessionConnected)
      wcEventEmitter.removeAllListeners(WCEventType.SessionDisconnected)
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
      logger.error('saga', 'watchWalletConnectSessions', 'channel error: ', err)
    }
  }
}

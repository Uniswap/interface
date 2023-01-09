import { Action } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { i18n } from 'src/app/i18n'
import { getSignerManager } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { sendTransaction, SendTransactionParams } from 'src/features/transactions/sendTransaction'
import { TransactionType } from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import {
  signMessage,
  signTransaction,
  signTypedDataMessage,
} from 'src/features/wallet/signing/signing'
import {
  deregisterWcPushNotifications,
  registerWcPushNotifications,
} from 'src/features/walletConnect/api'
import {
  DappInfo,
  EthMethod,
  EthSignMethod,
  SessionConnectedEvent,
  SessionDisconnectedEvent,
  SessionPendingEvent,
  SessionUpdatedEvent,
  SignRequestEvent,
  SwitchChainRequestEvent,
  TransactionRequestEvent,
  WCError,
  WCErrorType,
  WCEventType,
} from 'src/features/walletConnect/types'
import {
  initializeWalletConnect,
  reconnectAccountSessions,
  rejectRequest,
  sendSignature,
} from 'src/features/walletConnect/WalletConnect'
import {
  addPendingSession,
  addRequest,
  addSession,
  removeSession,
  updateSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { logger } from 'src/utils/logger'
import { createSaga } from 'src/utils/saga'
import { call, fork, put, take } from 'typed-redux-saga'

export enum WalletConnectEvent {
  Connected,
  Disconnected,
  NetworkChanged,
  TransactionConfirmed,
  TransactionFailed,
}

function createWalletConnectChannel(wcEventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const sessionConnectedHandler = (req: SessionConnectedEvent) => {
      emit(
        addSession({
          wcSession: { id: req.session_id, dapp: req.dapp },
          account: req.account,
        })
      )

      // Only show local notification and register for push notifs if new connection, not a reconnection
      if (req.is_new_connection) {
        emit(
          pushNotification({
            type: AppNotificationType.WalletConnect,
            address: req.account,
            event: WalletConnectEvent.Connected,
            dappName: req.dapp.name,
            imageUrl: req.dapp.icon,
            chainId: req.dapp.chain_id,
            hideDelay: 3000,
          })
        )
        registerWcPushNotifications({
          bridge: req.bridge_url,
          topic: req.client_id,
          address: req.account,
          peerName: req.dapp.name,
          language: 'en', // TODO: [MOB-3916] Use local user language
        })
      }
    }

    const networkChangedHandler = (req: SessionUpdatedEvent) => {
      emit(
        updateSession({ wcSession: { id: req.session_id, dapp: req.dapp }, account: req.account })
      )
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address: req.account,
          event: WalletConnectEvent.NetworkChanged,
          dappName: req.dapp.name,
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
          hideDelay: 2000,
        })
      )
    }

    const sessionDisconnectedHandler = (req: SessionDisconnectedEvent) => {
      emit(removeSession({ sessionId: req.session_id, account: req.account }))
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address: req.account,
          dappName: req.dapp.name,
          event: WalletConnectEvent.Disconnected,
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
          hideDelay: 3000,
        })
      )
      deregisterWcPushNotifications({
        topic: req.client_id,
      })
    }

    const sessionPendingHandler = (req: SessionPendingEvent) => {
      emit(
        addPendingSession({
          wcSession: { id: req.session_id, dapp: req.dapp },
        })
      )
    }

    const signRequestHandler = (req: SignRequestEvent) => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type as EthSignMethod,
            rawMessage: req.raw_message,
            message: req.message,
            internalId: req.request_internal_id,
            account: req.account,
            dapp: req.dapp,
          },
        })
      )
    }

    const transactionRequestHandler = (req: TransactionRequestEvent) => {
      const { to, from, value, data, gas, gas_price: gasPrice, nonce } = req.transaction
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type,
            transaction: {
              to: to ?? undefined,
              from: from ?? undefined,
              value: value ?? undefined,
              data: data ?? undefined,
              gasLimit: gas ?? undefined,
              gasPrice: gasPrice ?? undefined,
              nonce: nonce ?? undefined,
            },
            account: req.account,
            dapp: req.dapp,
            internalId: req.request_internal_id,
          },
        })
      )
    }

    const switchChainHandler = (req: SwitchChainRequestEvent) => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type,
            account: req.account,
            dapp: req.dapp,
            sessionId: req.session_id,
            internalId: req.request_internal_id,
            newChainId: req.new_chain_id,
          },
        })
      )
    }

    const errorHandler = (req: WCError) => {
      switch (req.type) {
        case WCErrorType.UnsupportedChainError:
          emit(
            pushNotification({
              type: AppNotificationType.Error,
              address: req.account ?? undefined,
              errorMessage: i18n.t('Failed to switch network, chain is not supported'),
            })
          )
          break
        default:
          logger.error('wcSaga', 'native module', 'errorHandler', req.type, req.message || '')
      }
    }

    const eventEmitters = [
      { type: WCEventType.SessionConnected, handler: sessionConnectedHandler },
      { type: WCEventType.NetworkChanged, handler: networkChangedHandler },
      { type: WCEventType.SessionDisconnected, handler: sessionDisconnectedHandler },
      { type: WCEventType.SessionPending, handler: sessionPendingHandler },
      { type: WCEventType.SignRequest, handler: signRequestHandler },
      { type: WCEventType.TransactionRequest, handler: transactionRequestHandler },
      { type: WCEventType.SwitchChainRequest, handler: switchChainHandler },
      { type: WCEventType.Error, handler: errorHandler },
    ]

    for (const { type, handler } of eventEmitters) {
      wcEventEmitter.addListener(type, handler)
    }

    const unsubscribe = () => {
      for (const { type } of eventEmitters) {
        wcEventEmitter.removeAllListeners(type)
      }
    }

    return unsubscribe
  })
}

export function* walletConnectSaga() {
  yield* call(initializeWalletConnect)
  yield* call(reconnectAccountSessions)
  yield* fork(watchWalletConnectEvents)
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
  method: EthSignMethod
  dapp: DappInfo
}

type SignTransactionParams = {
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: Account
  method: EthMethod.EthSignTransaction | EthMethod.EthSendTransaction
  dapp: DappInfo
}

export function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { requestInternalId, account, method } = params
  try {
    const signerManager = yield* call(getSignerManager)
    let signature = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      signature = yield* call(signMessage, params.message, account, signerManager)
    } else if (method === EthMethod.SignTypedData || method === EthMethod.SignTypedDataV4) {
      signature = yield* call(signTypedDataMessage, params.message, account, signerManager)
    } else if (method === EthMethod.EthSignTransaction) {
      signature = yield* call(signTransaction, params.transaction, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: SendTransactionParams = {
        chainId: params.transaction.chainId || ChainId.Mainnet,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          dapp: params.dapp,
        },
      }
      const { transactionResponse } = yield* call(sendTransaction, txParams)
      signature = transactionResponse.hash
    }

    yield* call(sendSignature, requestInternalId, signature)
  } catch (err) {
    yield* call(rejectRequest, requestInternalId)
    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event: WalletConnectEvent.TransactionFailed,
        dappName: params.dapp.name,
        imageUrl: params.dapp.icon,
        chainId: params.dapp.chain_id,
        address: account.address,
      })
    )
    logger.error('wcSaga', 'signMessage', 'signing error:', err)
  }
}

export const { wrappedSaga: signWcRequestSaga, actions: signWcRequestActions } = createSaga(
  signWcRequest,
  'signWalletConnect'
)

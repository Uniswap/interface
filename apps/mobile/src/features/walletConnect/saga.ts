import { Action } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { i18n } from 'src/app/i18n'
import {
  deregisterWcPushNotifications,
  registerWcPushNotifications,
} from 'src/features/walletConnect/api'
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
import { wcWeb3Wallet } from 'src/features/walletConnectV2/saga'
import { call, fork, put, take } from 'typed-redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  sendTransaction,
  SendTransactionParams,
} from 'wallet/src/features/transactions/sendTransactionSaga'
import { TransactionType } from 'wallet/src/features/transactions/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { getSignerManager } from 'wallet/src/features/wallet/context'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
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
  WalletConnectEvent,
  WCError,
  WCErrorType,
  WCEventType,
} from 'wallet/src/features/walletConnect/types'
import { createSaga } from 'wallet/src/utils/saga'

function createWalletConnectChannel(
  wcEventEmitter: NativeEventEmitter
): EventChannel<Action<unknown>> {
  return eventChannel<Action>((emit) => {
    const sessionConnectedHandler = async (req: SessionConnectedEvent): Promise<void> => {
      emit(
        addSession({
          wcSession: { id: req.session_id, dapp: req.dapp, version: '1' },
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
            hideDelay: 3 * ONE_SECOND_MS,
          })
        )
        await registerWcPushNotifications({
          bridge: req.bridge_url,
          topic: req.client_id,
          address: req.account,
          peerName: req.dapp.name,
          language: i18n.language,
        })
      }
    }

    const networkChangedHandler = (req: SessionUpdatedEvent): void => {
      emit(
        updateSession({
          wcSession: { id: req.session_id, dapp: req.dapp, version: '1' },
          account: req.account,
        })
      )
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address: req.account,
          event: WalletConnectEvent.NetworkChanged,
          dappName: req.dapp.name,
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
          hideDelay: 2 * ONE_SECOND_MS,
        })
      )
    }

    const sessionDisconnectedHandler = async (req: SessionDisconnectedEvent): Promise<void> => {
      emit(removeSession({ sessionId: req.session_id, account: req.account }))
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address: req.account,
          dappName: req.dapp.name,
          event: WalletConnectEvent.Disconnected,
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
          hideDelay: 3 * ONE_SECOND_MS,
        })
      )
      await deregisterWcPushNotifications({
        topic: req.client_id,
      })
    }

    const sessionPendingHandler = (req: SessionPendingEvent): void => {
      emit(
        addPendingSession({
          wcSession: { id: req.session_id, dapp: req.dapp, version: '1' },
        })
      )
    }

    const signRequestHandler = (req: SignRequestEvent): void => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type as EthSignMethod,
            rawMessage: req.raw_message,
            message: req.message,
            internalId: req.request_internal_id,
            sessionId: req.session_id,
            account: req.account,
            dapp: req.dapp,
            chainId: req.dapp.chain_id,
            version: '1',
          },
        })
      )
    }

    const transactionRequestHandler = (req: TransactionRequestEvent): void => {
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
            internalId: req.request_internal_id,
            sessionId: req.session_id,
            account: req.account,
            dapp: req.dapp,
            chainId: req.dapp.chain_id,
            version: '1',
          },
        })
      )
    }

    const switchChainHandler = (req: SwitchChainRequestEvent): void => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type,
            account: req.account,
            dapp: req.dapp,
            internalId: req.request_internal_id,
            sessionId: req.session_id,
            chainId: req.dapp.chain_id,
            newChainId: req.new_chain_id,
            version: '1',
          },
        })
      )
    }

    const errorHandler = (req: WCError): void => {
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
        case WCErrorType.DisconnectError:
          emit(
            pushNotification({
              type: AppNotificationType.Error,
              errorMessage: i18n.t(`Disconnecting resulted in error: {{message}}`, {
                message: req.message,
              }),
            })
          )
          break
        default:
          logger.error('Unhandled WC error', {
            tags: {
              file: 'walletConnect/saga',
              function: 'errorHandler',
              error: serializeError(req),
            },
          })
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

    const unsubscribe = (): void => {
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
    } catch (error) {
      logger.error('Error watching WalletConnect events', {
        tags: {
          file: 'walletConnect/saga',
          function: 'watchWalletConnectEvents',
          error: serializeError(error),
        },
      })
    }
  }
}

type SignMessageParams = {
  sessionId: string
  requestInternalId: string
  message: string
  account: Account
  method: EthSignMethod
  dapp: DappInfo
  chainId: ChainId
  version: '1' | '2'
}

type SignTransactionParams = {
  sessionId: string
  requestInternalId: string
  transaction: providers.TransactionRequest
  account: Account
  method: EthMethod.EthSendTransaction
  dapp: DappInfo
  chainId: ChainId
  version: '1' | '2'
}

export function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { sessionId, requestInternalId, account, method, chainId, version } = params
  try {
    const signerManager = yield* call(getSignerManager)
    let signature = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      signature = yield* call(signMessage, params.message, account, signerManager)
    } else if (method === EthMethod.SignTypedData || method === EthMethod.SignTypedDataV4) {
      signature = yield* call(signTypedDataMessage, params.message, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction) {
      const txParams: SendTransactionParams = {
        chainId: params.transaction.chainId || ChainId.Mainnet,
        account,
        options: {
          request: params.transaction,
        },
        typeInfo: {
          type: TransactionType.WCConfirm,
          chainId,
          dapp: params.dapp,
        },
      }
      const { transactionResponse } = yield* call(sendTransaction, txParams)
      signature = transactionResponse.hash
    }

    if (version === '1') {
      yield* call(sendSignature, requestInternalId, signature)
    } else if (version === '2') {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          result: signature,
        },
      })
    }
  } catch (error) {
    if (version === '1') {
      yield* call(rejectRequest, requestInternalId)
    } else if (version === '2') {
      yield* call(wcWeb3Wallet.respondSessionRequest, {
        topic: sessionId,
        response: {
          id: Number(requestInternalId),
          jsonrpc: '2.0',
          error: { code: 5000, message: `Signing error: ${error}` },
        },
      })
    }

    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        event: WalletConnectEvent.TransactionFailed,
        dappName: params.dapp.name,
        imageUrl: params.dapp.icon,
        chainId,
        address: account.address,
      })
    )
    logger.error('WalletConnect signing error', {
      tags: {
        file: 'walletConnect/saga',
        function: 'signWcRequest',
        error: serializeError(error),
      },
    })
  }
}

export const { wrappedSaga: signWcRequestSaga, actions: signWcRequestActions } = createSaga(
  signWcRequest,
  'signWalletConnect'
)

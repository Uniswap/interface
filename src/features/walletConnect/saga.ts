import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { Action } from '@reduxjs/toolkit'
import { providers, Wallet } from 'ethers'
import { arrayify, isHexString } from 'ethers/lib/utils'
import { NativeEventEmitter, NativeModules } from 'react-native'
import { eventChannel } from 'redux-saga'
import { i18n } from 'src/app/i18n'
import { getProvider, getSignerManager } from 'src/app/walletContext'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { signAndSendTransaction } from 'src/features/transactions/sendTransaction'
import { NativeSigner } from 'src/features/wallet/accounts/NativeSigner'
import { SignerManager } from 'src/features/wallet/accounts/SignerManager'
import { Account } from 'src/features/wallet/accounts/types'
import {
  DappInfo,
  EthMethod,
  EthSignMethod,
  EthTransactionMethod,
  SessionConnectedEvent,
  SessionDisconnectedEvent,
  SessionUpdatedEvent,
  SignRequestEvent,
  TransactionRequestEvent,
  WCError,
  WCErrorType,
  WCEventType,
} from 'src/features/walletConnect/types'
import {
  initializeWalletConnect,
  rejectRequest,
  sendSignature,
} from 'src/features/walletConnect/WalletConnect'
import {
  addRequest,
  addSession,
  removeSession,
  updateSession,
} from 'src/features/walletConnect/walletConnectSlice'
import { ensureLeading0x } from 'src/utils/addresses'
import { logger } from 'src/utils/logger'
import { createSaga } from 'src/utils/saga'
import { call, fork, put, take } from 'typed-redux-saga'

function createWalletConnectChannel(wcEventEmitter: NativeEventEmitter) {
  return eventChannel<Action>((emit) => {
    const sessionConnectedHandler = (req: SessionConnectedEvent) => {
      emit(
        addSession({
          wcSession: { id: req.session_id, dapp: req.dapp },
          account: req.account,
        })
      )
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          title: i18n.t('Connected to {{dappName}}', { dappName: req.dapp.name }),
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
        })
      )
    }

    const sessionUpdatedHandler = (req: SessionUpdatedEvent) => {
      emit(
        updateSession({ wcSession: { id: req.session_id, dapp: req.dapp }, account: req.account })
      )
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          title: i18n.t('Connected to {{dappName}}', { dappName: req.dapp.name }),
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
        })
      )
    }

    const sessionDisconnectedHandler = (req: SessionDisconnectedEvent) => {
      emit(removeSession({ sessionId: req.session_id, account: req.account }))
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          title: i18n.t('Disconnected from {{dappName}}', { dappName: req.dapp.name }),
          imageUrl: req.dapp.icon,
          chainId: req.dapp.chain_id,
        })
      )
    }

    const signRequestHandler = (req: SignRequestEvent) => {
      emit(
        addRequest({
          account: req.account,
          request: {
            type: req.type as EthSignMethod,
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
            type: req.type as EthTransactionMethod,
            transaction: {
              to,
              from,
              value,
              data,
              gas,
              gasPrice,
              nonce,
            },
            account: req.account,
            dapp: req.dapp,
            internalId: req.request_internal_id,
          },
        })
      )
    }

    const errorHandler = (req: WCError) => {
      switch (req.type) {
        case WCErrorType.UnsupportedChainError:
          if (req.dapp) {
            emit(
              pushNotification({
                type: AppNotificationType.WalletConnect,
                title: i18n.t('Failed to switch network, chain is not supported'),
                imageUrl: req.dapp.icon,
                chainId: req.dapp.chain_id,
              })
            )
          }
          break
        default:
          logger.error('wcSaga', 'native module', 'errorHandler', req.type, req.message || '')
      }
    }

    const eventEmitters = [
      { type: WCEventType.SessionConnected, handler: sessionConnectedHandler },
      { type: WCEventType.SessionUpdated, handler: sessionUpdatedHandler },
      { type: WCEventType.SessionDisconnected, handler: sessionDisconnectedHandler },
      { type: WCEventType.SignRequest, handler: signRequestHandler },
      { type: WCEventType.TransactionRequest, handler: transactionRequestHandler },
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

type EthTypedMessage = {
  domain: TypedDataDomain
  types: Record<string, Array<TypedDataField>>
  message: Record<string, any>
}

export function* signWcRequest(params: SignMessageParams | SignTransactionParams) {
  const { requestInternalId, account, method } = params
  try {
    const signerManager = yield* call(getSignerManager)
    let signature = ''
    if (method === EthMethod.PersonalSign || method === EthMethod.EthSign) {
      signature = yield* call(signMessage, params.message, account, signerManager)
    } else if (method === EthMethod.SignTypedData) {
      signature = yield* call(signTypedData, params.message, account, signerManager)
    } else if (method === EthMethod.EthSignTransaction) {
      signature = yield* call(signTransaction, params.transaction, account, signerManager)
    } else if (method === EthMethod.EthSendTransaction) {
      const provider = yield* call(getProvider, params.transaction.chainId || 1)
      const { transactionResponse } = yield* call(
        signAndSendTransaction,
        params.transaction,
        account,
        provider,
        signerManager
      )
      signature = transactionResponse.hash
    }

    yield* call(sendSignature, requestInternalId, signature, account.address)
  } catch (err) {
    yield* call(rejectRequest, requestInternalId, account.address)
    yield* put(
      pushNotification({
        type: AppNotificationType.WalletConnect,
        title: i18n.t('There was an issue submitting your transaction.'),
        imageUrl: params.dapp.icon,
        chainId: params.dapp.chain_id,
      })
    )
    logger.info('wcSaga', 'signMessage', 'signing error:', err)
  }
}

// If the message to be signed is a hex string, it must be converted to an array:
// https://docs.ethers.io/v5/api/signer/#Signer--signing-methods
async function signMessage(message: string, account: Account, signerManager: SignerManager) {
  const signer = await signerManager.getSignerForAccount(account)

  let signature
  if (isHexString(ensureLeading0x(message))) {
    signature = await signer.signMessage(arrayify(ensureLeading0x(message)))
  } else {
    signature = await signer.signMessage(message)
  }

  return ensureLeading0x(signature)
}

async function signTransaction(
  transaction: providers.TransactionRequest,
  account: Account,
  signerManager: SignerManager
) {
  const signer = await signerManager.getSignerForAccount(account)
  const signature = await signer.signTransaction(transaction)
  return ensureLeading0x(signature)
}

async function signTypedData(message: string, account: Account, signerManager: SignerManager) {
  const parsedData: EthTypedMessage = JSON.parse(message)
  const signer = await signerManager.getSignerForAccount(account)

  // ethers computes EIP712Domain type for you, so we should not pass it in directly
  // or else ethers will get confused about which type is the primary type
  // https://github.com/ethers-io/ethers.js/issues/687#issuecomment-714069471
  delete parsedData.types.EIP712Domain

  // https://github.com/LedgerHQ/ledgerjs/issues/86
  // Ledger does not support signTypedData yet
  if (signer instanceof NativeSigner || signer instanceof Wallet) {
    const signature = await signer._signTypedData(
      parsedData.domain,
      parsedData.types,
      parsedData.message
    )

    return ensureLeading0x(signature)
  } else {
    logger.error('wcSaga', 'signTypedData', 'cannot sign typed data')
    return ''
  }
}

export const { wrappedSaga: signWcRequestSaga, actions: signWcRequestActions } = createSaga(
  signWcRequest,
  'signWalletConnect'
)

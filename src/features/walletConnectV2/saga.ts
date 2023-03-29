import { Action } from '@reduxjs/toolkit'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { ProposalTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { Alert } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { CallEffect, ChannelTakeEffect, PutEffect } from 'redux-saga/effects'
import { i18n } from 'src/app/i18n'
import { config } from 'src/config'
import { ALL_SUPPORTED_CHAIN_IDS, CHAIN_INFO } from 'src/constants/chains'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { registerWCv2ClientForPushNotifications } from 'src/features/walletConnect/api'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { EthMethod } from 'src/features/walletConnect/types'
import {
  addPendingSession,
  addRequest,
  removeSession,
} from 'src/features/walletConnect/walletConnectSlice'
import {
  getAccountAddressFromEIP155String,
  getChainIdFromEIP155String,
  parseProposalNamespaces,
  parseSignRequest,
  parseTransactionRequest,
} from 'src/features/walletConnectV2/utils'
import { logger } from 'src/utils/logger'
import { ONE_SECOND_MS } from 'src/utils/time'
import { call, put, take } from 'typed-redux-saga'

export let wcWeb3Wallet: IWeb3Wallet

async function initializeWeb3Wallet(): Promise<void> {
  const wcCore = new Core({
    projectId: config.walletConnectProjectId,
  })

  wcWeb3Wallet = await Web3Wallet.init({
    core: wcCore,
    metadata: {
      name: 'Uniswap Wallet',
      description:
        'Built by the most trusted team in DeFi, Uniswap Wallet allows you to maintain full custody and control of your assets.',
      url: 'https://uniswap.org/app',
      icons: ['https://gateway.pinata.cloud/ipfs/QmR1hYqhDMoyvJtwrQ6f1kVyfEKyK65XH3nbCimXBMkHJg'],
    },
  })

  const clientId = await wcCore.crypto.getClientId()
  registerWCv2ClientForPushNotifications(clientId)
}

function createWalletConnectV2Channel(): EventChannel<Action<unknown>> {
  return eventChannel<Action>((emit) => {
    /*
     * Handle incoming `session_proposal` events that contain the dapp attempting to pair
     * and the proposal namespaces (chains, methods, events)
     */
    const sessionProposalHandler = async (
      proposal: Omit<Web3WalletTypes.BaseEventArgs<ProposalTypes.Struct>, 'topic'>
    ): Promise<void> => {
      const {
        params: {
          requiredNamespaces,
          optionalNamespaces,
          proposer: { metadata: dapp },
        },
        id,
      } = proposal

      try {
        const { chains, proposalNamespaces } = parseProposalNamespaces(
          requiredNamespaces,
          optionalNamespaces
        )
        emit(
          addPendingSession({
            wcSession: {
              id: id.toString(),
              proposalNamespaces,
              chains,
              version: '2',
              dapp: {
                name: dapp.name,
                url: dapp.url,
                icon: dapp.icons[0] ?? null,
                version: '2',
              },
            },
          })
        )
      } catch (e) {
        // Reject pending session if required namespaces includes non-EVM chains or unsupported EVM chains
        wcWeb3Wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })

        const chainLabels = ALL_SUPPORTED_CHAIN_IDS.map(
          (chainId) => CHAIN_INFO[chainId].label
        ).join(', ')

        Alert.alert(
          i18n.t('Connection Error'),
          i18n.t('Uniswap Wallet currently only supports {{ chains }}. \n\n {{ error }}', {
            chains: chainLabels,
            error: e,
          })
        )

        logger.debug(
          'WalletConnectV2Saga',
          'sessionProposalHandler',
          'Rejected session proposal due to invalid proposal namespaces: ',
          e
        )
      }
    }

    const sessionRequestHandler = async (event: Web3WalletTypes.SessionRequest): Promise<void> => {
      const { topic, params, id } = event
      const { request: wcRequest, chainId: wcChainId } = params
      const { method, params: requestParams } = wcRequest

      const chainId = getChainIdFromEIP155String(wcChainId)
      const requestSession = wcWeb3Wallet.engine.signClient.session.get(topic)
      const dapp = requestSession.peer.metadata

      if (!chainId) {
        throw new Error('WalletConnect 2.0 session request has invalid chainId')
      }

      switch (method) {
        case EthMethod.EthSign:
        case EthMethod.PersonalSign:
        case EthMethod.SignTypedData:
        case EthMethod.SignTypedDataV4: {
          const { account, request } = parseSignRequest(
            method,
            topic,
            id,
            chainId,
            dapp,
            requestParams
          )
          emit(
            addRequest({
              account,
              request,
            })
          )
          break
        }
        case EthMethod.EthSendTransaction: {
          const { account, request } = parseTransactionRequest(
            method,
            topic,
            id,
            chainId,
            dapp,
            requestParams
          )
          emit(
            addRequest({
              account,
              request,
            })
          )
          break
        }
        default:
          // Reject request for an invalid method
          logger.warn(
            'WalletConnectV2Saga',
            'sessionRequestHandler',
            `Session request method is unsupported: ${method}`
          )
          wcWeb3Wallet.respondSessionRequest({
            topic,
            response: {
              id,
              jsonrpc: '2.0',
              error: getSdkError('WC_METHOD_UNSUPPORTED'),
            },
          })
      }
    }

    const sessionDeleteHandler = async (event: Web3WalletTypes.SessionDelete): Promise<void> => {
      const { topic } = event
      const session = wcWeb3Wallet.engine.signClient.session.get(topic)
      const dapp = session.peer.metadata
      const account = session.namespaces.eip155?.accounts[0]

      if (!account) {
        logger.error(
          'WalletConnectV2Saga',
          'sessionDeleteHandler',
          'Account not found in session namespaces'
        )
        return
      }

      const address = getAccountAddressFromEIP155String(account)
      if (!address) {
        logger.error(
          'WalletConnectV2Saga',
          'sessionDeleteHandler',
          'Unable to parse account address from session namespaces'
        )
        return
      }

      emit(removeSession({ account: address, sessionId: event.topic }))
      emit(
        pushNotification({
          type: AppNotificationType.WalletConnect,
          address,
          dappName: dapp.name,
          event: WalletConnectEvent.Disconnected,
          imageUrl: dapp.icons[0] ?? null,
          hideDelay: 3 * ONE_SECOND_MS,
        })
      )
    }

    wcWeb3Wallet.on('session_proposal', sessionProposalHandler)
    wcWeb3Wallet.on('session_request', sessionRequestHandler)
    wcWeb3Wallet.on('session_delete', sessionDeleteHandler)

    const unsubscribe = (): void => {
      wcWeb3Wallet.off('session_proposal', sessionProposalHandler)
      wcWeb3Wallet.off('session_request', sessionRequestHandler)
      wcWeb3Wallet.off('session_delete', sessionDeleteHandler)
    }

    return unsubscribe
  })
}

export function* watchWalletConnectV2Events(): Generator<
  | CallEffect<EventChannel<Action<unknown>>>
  | ChannelTakeEffect<Action<unknown>>
  | PutEffect<Action<unknown>>,
  void,
  unknown
> {
  const wcV2Channel = yield* call(createWalletConnectV2Channel)

  while (true) {
    try {
      const payload = yield* take(wcV2Channel)
      yield* put(payload)
    } catch (err) {
      logger.error('wcV2Saga', 'watchWalletConnectSessions', 'channel error: ', err)
    }
  }
}

export function* walletConnectV2Saga(): Generator<CallEffect<void>, void, unknown> {
  yield* call(initializeWeb3Wallet)
  yield* call(watchWalletConnectV2Events)
}

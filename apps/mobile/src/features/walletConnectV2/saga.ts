import { AnyAction } from '@reduxjs/toolkit'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { PendingRequestTypes, ProposalTypes } from '@walletconnect/types'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { IWeb3Wallet, Web3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'
import { Alert } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { CallEffect, ForkEffect } from 'redux-saga/effects'
import { appSelect } from 'src/app/hooks'
import { i18n } from 'src/app/i18n'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { registerWCv2ClientForPushNotifications } from 'src/features/walletConnect/api'
import { WalletConnectEvent } from 'src/features/walletConnect/saga'
import { EthEvent, EthMethod } from 'src/features/walletConnect/types'
import {
  addPendingSession,
  addRequest,
  addSession,
  removeSession,
  setHasPendingSessionError,
} from 'src/features/walletConnect/walletConnectSlice'
import {
  getAccountAddressFromEIP155String,
  getChainIdFromEIP155String,
  getSupportedWalletConnectChains,
  parseSignRequest,
  parseTransactionRequest,
} from 'src/features/walletConnectV2/utils'
import { call, fork, put, take } from 'typed-redux-saga'
import { config } from 'wallet/src/config'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { logger } from 'wallet/src/features/logger/logger'
import { selectAccounts, selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'

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

function createWalletConnectV2Channel(): EventChannel<AnyAction> {
  return eventChannel<AnyAction>((emit) => {
    /*
     * Handle incoming `session_proposal` events that contain the dapp attempting to pair
     * and the proposal namespaces (chains, methods, events)
     */
    const sessionProposalHandler = async (
      proposalEvent: Omit<Web3WalletTypes.BaseEventArgs<ProposalTypes.Struct>, 'topic'>
    ): Promise<void> => {
      const { params: proposal } = proposalEvent
      emit({ type: 'session_proposal', proposal })
    }

    const sessionRequestHandler = async (
      request: Web3WalletTypes.SessionRequest
    ): Promise<void> => {
      emit({ type: 'session_request', request })
    }

    const sessionDeleteHandler = async (session: Web3WalletTypes.SessionDelete): Promise<void> => {
      emit({ type: 'session_delete', session })
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

export function* watchWalletConnectV2Events() {
  const wcV2Channel = yield* call(createWalletConnectV2Channel)

  while (true) {
    try {
      const event = yield* take(wcV2Channel)
      if (event.type === 'session_proposal') {
        yield* call(handleSessionProposal, event.proposal)
      } else if (event.type === 'session_request') {
        yield* call(handleSessionRequest, event.request)
      } else if (event.type === 'session_delete') {
        yield* call(handleSessionDelete, event.session)
      }
    } catch (err) {
      logger.error('wcV2Saga', 'watchWalletConnectSessions', 'channel error: ', err)
    }
  }
}

export function* handleSessionProposal(proposal: ProposalTypes.Struct) {
  const activeAccountAddress = yield* appSelect(selectActiveAccountAddress)

  const {
    id,
    proposer: { metadata: dapp },
  } = proposal

  try {
    const supportedEip155Chains = ALL_SUPPORTED_CHAIN_IDS.map((chainId) => `eip155:${chainId}`)
    const accounts = supportedEip155Chains.map((chain) => `${chain}:${activeAccountAddress}`)

    const namespaces = buildApprovedNamespaces({
      proposal,
      supportedNamespaces: {
        eip155: {
          chains: supportedEip155Chains,
          methods: [
            EthMethod.EthSign,
            EthMethod.EthSendTransaction,
            EthMethod.PersonalSign,
            EthMethod.SignTypedData,
            EthMethod.SignTypedDataV4,
          ],
          events: [EthEvent.AccountsChanged, EthEvent.ChainChanged],
          accounts,
        },
      },
    })

    // Extract chains from approved namespaces to show in UI for pending session
    const proposalChainIds: ChainId[] = []
    Object.entries(namespaces).forEach(([key, namespace]) => {
      const { chains } = namespace
      // EVM chain(s) are specified in either `eip155:CHAIN` or chains array
      const eip155Chains = key.includes(':') ? [key] : chains
      proposalChainIds.push(...getSupportedWalletConnectChains(eip155Chains))
    })

    yield* put(
      addPendingSession({
        wcSession: {
          id: id.toString(),
          proposalNamespaces: namespaces,
          chains: proposalChainIds,
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

    const chainLabels = ALL_SUPPORTED_CHAIN_IDS.map((chainId) => CHAIN_INFO[chainId].label).join(
      ', '
    )

    Alert.alert(
      i18n.t('Connection Error'),
      i18n.t('Uniswap Wallet currently only supports {{ chains }}. \n\n {{ error }}', {
        chains: chainLabels,
        error: e,
      }),
      [
        {
          text: 'OK',
          onPress: function* onPress(): Generator {
            yield* put(setHasPendingSessionError(false))
          },
        },
      ]
    )

    // Set error state to cancel loading state in WalletConnectModal UI
    yield* put(setHasPendingSessionError(true))

    logger.debug(
      'WalletConnectV2Saga',
      'sessionProposalHandler',
      'Rejected session proposal due to invalid proposal namespaces: ',
      e
    )
  }
}

export function* handleSessionRequest(sessionRequest: PendingRequestTypes.Struct) {
  const { topic, params, id } = sessionRequest
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
      const { account, request } = parseSignRequest(method, topic, id, chainId, dapp, requestParams)
      yield* put(
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
      yield* put(
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

export function* handleSessionDelete(event: Web3WalletTypes.SessionDelete) {
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

  yield* put(removeSession({ account: address, sessionId: event.topic }))
  yield* put(
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

export function* populateActiveSessions() {
  // Fetch all active sessions and add to store
  const sessions = wcWeb3Wallet.getActiveSessions()

  const accounts = yield* appSelect(selectAccounts)

  for (const session of Object.values(sessions)) {
    // Get account address connected to the session from first namespace
    const namespaces = Object.values(session.namespaces)
    const eip155Account = namespaces[0]?.accounts[0]
    if (!eip155Account) continue

    const accountAddress = getAccountAddressFromEIP155String(eip155Account)

    if (!accountAddress) continue

    // Verify account address for session exists in wallet's accounts
    const matchingAccount = Object.values(accounts).find(
      (account) => account.address.toLowerCase() === accountAddress.toLowerCase()
    )
    if (!matchingAccount) continue

    // Get all chains for session namespaces, supporting `eip155:CHAIN_ID` and `eip155` namespace formats
    const chains: ChainId[] = []
    Object.entries(session.namespaces).forEach(([key, namespace]) => {
      const eip155Chains = key.includes(':') ? [key] : namespace.chains
      chains.push(...getSupportedWalletConnectChains(eip155Chains))
    })

    yield* put(
      addSession({
        wcSession: {
          id: session.topic,
          dapp: {
            name: session.peer.metadata.name,
            url: session.peer.metadata.url,
            icon: session.peer.metadata.icons[0] ?? null,
            version: '2',
          },
          chains,
          namespaces: session.namespaces,
          version: '2',
        },
        account: accountAddress,
      })
    )
  }
}

// Load any existing pending session proposals from the WC connection
export function* fetchPendingSessionProposals() {
  const pendingSessionProposals = wcWeb3Wallet.getPendingSessionProposals()
  for (const proposal of Object.values(pendingSessionProposals)) {
    yield* call(handleSessionProposal, proposal)
  }
}

// Load any existing pending session requests from the WC connection
export function* fetchPendingSessionRequests() {
  const pendingSessionRequests = wcWeb3Wallet.getPendingSessionRequests()
  for (const sessionRequest of Object.values(pendingSessionRequests)) {
    yield* call(handleSessionRequest, sessionRequest)
  }
}

export function* walletConnectV2Saga(): Generator<
  CallEffect<void> | ForkEffect<void>,
  void,
  unknown
> {
  yield* call(initializeWeb3Wallet)
  yield* call(populateActiveSessions)
  yield* fork(fetchPendingSessionProposals)
  yield* fork(fetchPendingSessionRequests)
  yield* fork(watchWalletConnectV2Events)
}

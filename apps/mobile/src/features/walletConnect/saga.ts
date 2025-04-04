import { AnyAction } from '@reduxjs/toolkit'
import { IWalletKit, WalletKit, WalletKitTypes } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import '@walletconnect/react-native-compat'
import { PendingRequestTypes, ProposalTypes } from '@walletconnect/types'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { Alert } from 'react-native'
import { EventChannel, eventChannel } from 'redux-saga'
import { MobileState } from 'src/app/mobileReducer'
import { registerWCClientForPushNotifications } from 'src/features/walletConnect/api'
import { fetchDappDetails } from 'src/features/walletConnect/fetchDappDetails'
import {
  getAccountAddressFromEIP155String,
  getChainIdFromEIP155String,
  getSupportedWalletConnectChains,
  parseSignRequest,
  parseTransactionRequest,
} from 'src/features/walletConnect/utils'
import {
  addPendingSession,
  addRequest,
  addSession,
  removeSession,
  setHasPendingSessionError,
} from 'src/features/walletConnect/walletConnectSlice'
import { call, fork, put, select, take } from 'typed-redux-saga'
import { config } from 'uniswap/src/config'
import { ALL_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import i18n from 'uniswap/src/i18n'
import { EthEvent, EthMethod, WalletConnectEvent } from 'uniswap/src/types/walletConnect'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectAccounts, selectActiveAccountAddress } from 'wallet/src/features/wallet/selectors'

export let wcWeb3Wallet: IWalletKit

const PROJECT_ID = {
  dev: config.walletConnectProjectIdDev,
  beta: config.walletConnectProjectIdBeta,
  default: config.walletConnectProjectId,
}

let wcWeb3WalletReadyResolve: () => void
let wcWeb3WalletReadyReject: (e: unknown) => void
const wcWeb3WalletReady = new Promise<void>((resolve, reject) => {
  wcWeb3WalletReadyResolve = resolve
  wcWeb3WalletReadyReject = reject
})
export const waitForWcWeb3WalletIsReady = () => wcWeb3WalletReady

function getProjectId() {
  if (isDevEnv()) {
    return PROJECT_ID.dev
  }
  if (isBetaEnv()) {
    return PROJECT_ID.beta
  }
  return PROJECT_ID.default
}

async function initializeWeb3Wallet(): Promise<void> {
  try {
    const wcCore = new Core({
      projectId: getProjectId(),
    })

    wcWeb3Wallet = await WalletKit.init({
      core: wcCore,
      metadata: {
        name: 'Uniswap Wallet',
        description:
          'Built by the most trusted team in DeFi, Uniswap Wallet allows you to maintain full custody and control of your assets.',
        url: 'https://uniswap.org/app',
        icons: ['https://gateway.pinata.cloud/ipfs/QmR1hYqhDMoyvJtwrQ6f1kVyfEKyK65XH3nbCimXBMkHJg'],
        redirect: {
          native: 'uniswap://',
        },
      },
    })

    const clientId = await wcWeb3Wallet.engine.signClient.core.crypto.getClientId()
    await registerWCClientForPushNotifications(clientId)
    wcWeb3WalletReadyResolve?.()
  } catch (e) {
    wcWeb3WalletReadyReject(e)
  }
}

function createWalletConnectChannel(): EventChannel<AnyAction> {
  return eventChannel<AnyAction>((emit) => {
    /*
     * Handle incoming `session_proposal` events that contain the dapp attempting to pair
     * and the proposal namespaces (chains, methods, events)
     */
    const sessionProposalHandler = async (
      proposalEvent: Omit<WalletKitTypes.BaseEventArgs<ProposalTypes.Struct>, 'topic'>,
    ): Promise<void> => {
      const { params: proposal } = proposalEvent
      emit({ type: 'session_proposal', proposal })
    }

    const sessionRequestHandler = async (request: WalletKitTypes.SessionRequest): Promise<void> => {
      emit({ type: 'session_request', request })
    }

    const sessionDeleteHandler = async (session: WalletKitTypes.SessionDelete): Promise<void> => {
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

function* watchWalletConnectEvents() {
  const wcChannel = yield* call(createWalletConnectChannel)

  while (true) {
    try {
      const event = yield* take(wcChannel)
      if (event.type === 'session_proposal') {
        yield* call(handleSessionProposal, event.proposal)
      } else if (event.type === 'session_request') {
        yield* call(handleSessionRequest, event.request)
      } else if (event.type === 'session_delete') {
        yield* call(handleSessionDelete, event.session)
      }
    } catch (error) {
      logger.error(error, {
        tags: { file: 'walletConnect/saga', function: 'watchWalletConnectEvents' },
      })
    }
  }
}

function showAlert(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => resolve(true),
      },
    ])
  })
}

function* cancelErrorSession(dappName: string, chainLabels: string, proposalId: number) {
  yield* call([wcWeb3Wallet, wcWeb3Wallet.rejectSession], {
    id: proposalId,
    reason: getSdkError('UNSUPPORTED_CHAINS'),
  })

  yield* call(
    showAlert,
    i18n.t('walletConnect.error.connection.title'),
    i18n.t('walletConnect.error.connection.message', {
      chainNames: chainLabels,
      dappName,
    }),
  )

  // Set error state to cancel loading state in WalletConnectModal UI
  yield* put(setHasPendingSessionError(true))

  // Allow users to rescan again
  yield* put(setHasPendingSessionError(false))
}

function* handleSessionProposal(proposal: ProposalTypes.Struct) {
  const activeAccountAddress = yield* select(selectActiveAccountAddress)

  const {
    id,
    proposer: { metadata: dapp },
  } = proposal

  const namespaceCheck = proposal.requiredNamespaces
  const firstNamespace = Object.keys(namespaceCheck)[0]

  if (firstNamespace && firstNamespace !== 'eip155') {
    const chainLabels = ALL_CHAIN_IDS.map(getChainLabel).join(', ')
    yield* cancelErrorSession(dapp.name, chainLabels, proposal.id)
    return
  }

  try {
    const supportedEip155Chains = ALL_CHAIN_IDS.map((chainId) => `eip155:${chainId}`)
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
    const proposalChainIds: UniverseChainId[] = []
    Object.entries(namespaces).forEach(([key, namespace]) => {
      const { chains } = namespace
      // EVM chain(s) are specified in either `eip155:CHAIN` or chains array
      const eip155Chains = key.includes(':') ? [key] : chains
      proposalChainIds.push(...(getSupportedWalletConnectChains(eip155Chains) ?? []))
    })

    yield* put(
      addPendingSession({
        wcSession: {
          id: id.toString(),
          proposalNamespaces: namespaces,
          chains: proposalChainIds,
          dapp: {
            name: dapp.name,
            url: dapp.url,
            icon: dapp.icons[0] ?? null,
            source: 'walletconnect',
          },
        },
      }),
    )
  } catch (e) {
    const chainLabels = ALL_CHAIN_IDS.map(getChainLabel).join(', ')

    yield* cancelErrorSession(dapp.name, chainLabels, proposal.id)

    logger.debug(
      'WalletConnectSaga',
      'sessionProposalHandler',
      'Rejected session proposal due to invalid proposal namespaces: ',
      e,
    )
  }
}

function* handleSessionRequest(sessionRequest: PendingRequestTypes.Struct) {
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
        }),
      )

      break
    }
    case EthMethod.EthSendTransaction: {
      const { account, request } = parseTransactionRequest(method, topic, id, chainId, dapp, requestParams)
      yield* put(
        addRequest({
          account,
          request,
        }),
      )

      break
    }
    default:
      // Reject request for an invalid method
      logger.warn('WalletConnectSaga', 'sessionRequestHandler', `Session request method is unsupported: ${method}`)
      yield* call([wcWeb3Wallet, wcWeb3Wallet.respondSessionRequest], {
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: getSdkError('WC_METHOD_UNSUPPORTED'),
        },
      })
  }
}

function* handleSessionDelete(event: WalletKitTypes.SessionDelete) {
  const { topic } = event

  const currentState = yield* select((state: MobileState) => state.walletConnect)

  const { dappName, dappIcon } = fetchDappDetails(topic, currentState)

  yield* put(
    pushNotification({
      type: AppNotificationType.WalletConnect,
      event: WalletConnectEvent.Disconnected,
      dappName,
      imageUrl: dappIcon,
      hideDelay: 3 * ONE_SECOND_MS,
    }),
  )

  yield* put(removeSession({ sessionId: topic }))
}

function* populateActiveSessions() {
  // Fetch all active sessions and add to store
  const sessions = wcWeb3Wallet.getActiveSessions()

  const accounts = yield* select(selectAccounts)

  for (const session of Object.values(sessions)) {
    // Get account address connected to the session from first namespace
    const namespaces = Object.values(session.namespaces)
    const eip155Account = namespaces[0]?.accounts[0]
    if (!eip155Account) {
      continue
    }

    const accountAddress = getAccountAddressFromEIP155String(eip155Account)

    if (!accountAddress) {
      continue
    }

    // Verify account address for session exists in wallet's accounts
    const matchingAccount = Object.values(accounts).find(
      (account) => account.address.toLowerCase() === accountAddress.toLowerCase(),
    )
    if (!matchingAccount) {
      continue
    }

    // Get all chains for session namespaces, supporting `eip155:CHAIN_ID` and `eip155` namespace formats
    const chains: UniverseChainId[] = []
    Object.entries(session.namespaces).forEach(([key, namespace]) => {
      const eip155Chains = key.includes(':') ? [key] : namespace.chains
      chains.push(...(getSupportedWalletConnectChains(eip155Chains) ?? []))
    })

    yield* put(
      addSession({
        wcSession: {
          id: session.topic,
          dapp: {
            name: session.peer.metadata.name,
            url: session.peer.metadata.url,
            icon: session.peer.metadata.icons[0] ?? null,
            source: 'walletconnect',
          },
          chains,
          namespaces: session.namespaces,
        },
        account: accountAddress,
      }),
    )
  }
}

// Load any existing pending session proposals from the WC connection
function* fetchPendingSessionProposals() {
  const pendingSessionProposals = wcWeb3Wallet.getPendingSessionProposals()
  for (const proposal of Object.values(pendingSessionProposals)) {
    yield* call(handleSessionProposal, proposal)
  }
}

// Load any existing pending session requests from the WC connection
function* fetchPendingSessionRequests() {
  const pendingSessionRequests = wcWeb3Wallet.getPendingSessionRequests()
  for (const sessionRequest of Object.values(pendingSessionRequests)) {
    yield* call(handleSessionRequest, sessionRequest)
  }
}

export function* walletConnectSaga() {
  yield* call(initializeWeb3Wallet)
  yield* call(populateActiveSessions)
  yield* fork(fetchPendingSessionProposals)
  yield* fork(fetchPendingSessionRequests)
  yield* fork(watchWalletConnectEvents)
}

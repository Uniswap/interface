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
import { addPendingSession } from 'src/features/walletConnect/walletConnectSlice'
import {
  getChainFromEIP155String,
  getSupportedWalletConnectChains,
} from 'src/features/walletConnectV2/utils'
import { toSupportedChainId } from 'src/utils/chainId'
import { logger } from 'src/utils/logger'
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
      const dapp = proposal.params.proposer.metadata
      const proposalNamespaces = proposal.params.requiredNamespaces

      // Check if proposal namespaces includes any unsupported EVM chains
      const hasUnsupportedEIP155Chains = proposalNamespaces.eip155?.chains
        .map((chain) => getChainFromEIP155String(chain))
        .some((chain) => toSupportedChainId(chain) === null)

      // Reject pending session if namespaces includes non-EVM chains or unsupported EVM chains
      if (!proposalNamespaces.eip155 || hasUnsupportedEIP155Chains) {
        const chainLabels = ALL_SUPPORTED_CHAIN_IDS.map(
          (chainId) => CHAIN_INFO[chainId].label
        ).join(', ')
        Alert.alert(
          i18n.t('Connection Error'),
          i18n.t('Uniswap Wallet currently only supports {{ chains }}', { chains: chainLabels })
        )
        wcWeb3Wallet.rejectSession({
          id: proposal.id,
          reason: getSdkError('UNSUPPORTED_CHAINS'),
        })
        return
      }

      const chains = getSupportedWalletConnectChains(proposalNamespaces.eip155?.chains)

      emit(
        addPendingSession({
          wcSession: {
            id: proposal.id.toString(),
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
    }

    const sessionRequestHandler = async (): Promise<void> => {
      // TODO: Handle session method requests, such as "eth_sign", "eth_sendTransaction", etc.
    }

    wcWeb3Wallet.on('session_proposal', sessionProposalHandler)
    wcWeb3Wallet.on('session_request', sessionRequestHandler)

    const unsubscribe = (): void => {
      wcWeb3Wallet.off('session_proposal', sessionProposalHandler)
      wcWeb3Wallet.off('session_request', sessionRequestHandler)
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

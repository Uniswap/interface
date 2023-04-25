import { Provider, TransactionResponse } from '@ethersproject/providers'
import { createAction } from '@reduxjs/toolkit'
import { ethers, providers } from 'ethers'
import { call, put, select, take } from 'typed-redux-saga'
import { appSelect, RootState } from '../../state'
import { sendMessageToSpecificTab } from '../../utils/messageUtils'
import { hexlifyTransaction } from '../../utils/transaction'
import { getChainIdFromString } from '../chains/chains'
import { setCurrentChain } from '../chains/slice'
import { getProvider, getSignerManager } from '../wallet/context'
import { SignerManager } from '../wallet/signing/SignerManager'
import { signMessage, signTypedDataMessage } from '../wallet/signing/signing'
import { Account, AccountType } from '../wallet/types'
import {
  AccountResponse,
  ChangeChainResponse,
  ConnectResponse,
  DappRequestType,
  DappResponseType,
  SendTransactionResponse,
  SignMessageResponse,
  SignTypedDataResponse,
} from './dappRequestTypes'
import { dappRequestActions, DappRequestStoreItem } from './slice'
import { openRequestsWindowIfNeeded } from './utils'

const DEFAULT_IMAGE_PATH = 'assets/default.png'
const SUCCESS_IMAGE_PATH = 'assets/success.png'
const FAIL_IMAGE_PATH = 'assets/fail.png'
const PENDING_IMAGE_PATH = 'assets/pending.png'

export type DappRequestSagaParams = Omit<DappRequestStoreItem, 'account'>

export const addRequest = createAction<DappRequestSagaParams>(
  `dappRequest/handleRequest`
)
export const confirmRequest = createAction<DappRequestStoreItem>(
  `dappRequest/confirmRequest`
)
export const rejectRequest = createAction<DappRequestStoreItem>(
  `dappRequest/rejectRequest`
)

export function* dappRequestWatcher() {
  while (true) {
    const { payload, type } = yield* take(addRequest)

    if (type === addRequest.type) {
      yield* call(handleRequest, payload)
    }
  }
}

/**
 * Handles a request from a dApp.
 * If it is account-specific, get the active account and add it to the request
 * @param requestParams DappRequest and senderTabId (required for sending response)
 */
export function* handleRequest(requestParams: DappRequestSagaParams) {
  const accounts = yield* appSelect((state: RootState) => state.wallet.accounts)
  const activeAccount = yield* call(getCurrentAccount, accounts)

  const requestForStore: DappRequestStoreItem = {
    dappRequest: requestParams.dappRequest,
    senderTabId: requestParams.senderTabId,
    account: activeAccount,
  }

  // If the request is a connect, we don't need to prompt the user since it just getting the provider url
  if (requestForStore.dappRequest.type === DappRequestType.Connect) {
    yield* put(confirmRequest(requestForStore))
  } else {
    yield* put(dappRequestActions.add(requestForStore))
    yield* call(openRequestsWindowIfNeeded)
  }
}

export function* sendTransaction(
  transactionRequest: ethers.providers.TransactionRequest,
  account: Account,
  requestId: string,
  senderTabId: number
) {
  // Get currently selected chain id
  const chainId = yield* call(getCurrentChainId)

  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId)
  const signerManager = yield* call(getSignerManager)

  if (account.type !== AccountType.SignerMnemonic)
    throw new Error('Account must support signing')

  const transactionResponse = yield* call(
    signAndSendTransaction,
    transactionRequest,
    account,
    provider,
    signerManager
  )

  yield* call(
    handleTransactionResponse,
    transactionResponse,
    provider,
    requestId,
    senderTabId
  )

  return transactionResponse
}

export function* getAccount(requestId: string, senderTabId: number) {
  const accounts = yield* select<(state: RootState) => Record<string, Account>>(
    (state: RootState) => state.wallet.accounts
  )
  const account = yield* call(getCurrentAccount, accounts)

  const response: AccountResponse = {
    type: DappResponseType.AccountResponse,
    requestId,
    accountAddress: account.address,
  }
  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

function handleTransactionResponse(
  transactionResponse: ethers.providers.TransactionResponse,
  provider: Provider,
  requestId: string,
  senderTabId: number
) {
  const response: SendTransactionResponse = {
    type: DappResponseType.SendTransactionResponse,
    transaction: transactionResponse,
    requestId,
  }
  onTransactionSentToChain(transactionResponse, provider)
  sendMessageToSpecificTab(response, senderTabId)
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
): Promise<ethers.providers.TransactionResponse> {
  const signer = await signerManager.getSignerForAccount(account)
  if (!signer) {
    throw new Error(`No signer found for ${account}`)
  }

  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTransaction = await connectedSigner.signTransaction(
    populatedRequest
  )
  const transactionResponse = await provider.sendTransaction(signedTransaction)
  return transactionResponse
}

function onTransactionSentToChain(
  transactionResponse: TransactionResponse,
  provider: Provider
): void {
  // Update chrome icon
  chrome.action.setIcon({
    path: PENDING_IMAGE_PATH,
  })

  // Listen for transaction receipt
  provider?.waitForTransaction(transactionResponse.hash, 1).then((receipt) => {
    if (receipt.status === 1) {
      // TODO: Clean up chrome notifications
      chrome.action.setIcon({
        path: SUCCESS_IMAGE_PATH,
      })

      // Send chrome notification that transaction was successful
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/success.png',
        title: 'Transaction successful',
        message: `Transaction ${transactionResponse.hash} was successful`,
      })
    } else {
      chrome.action.setIcon({
        path: FAIL_IMAGE_PATH,
      })
      // Send chrome notification that transaction failed
      chrome.notifications.create({
        type: 'basic',
        iconUrl: FAIL_IMAGE_PATH,
        title: 'Transaction failed',
        message: `Transaction ${transactionResponse.hash} failed`,
        buttons: [
          {
            title: 'Retry',
          },
        ],
      })
    }

    // Reset chrome icon after 15 seconds regardless of success/failure
    setTimeout(() => {
      chrome.action.setIcon({
        path: DEFAULT_IMAGE_PATH,
      })
    }, 15000)
  })
}

// TODO: Update this when we have proper active accounts
export function getCurrentAccount(accounts: Record<string, Account>): Account {
  const accountKeys = Object.keys(accounts) || []

  if (accountKeys.length === 0) {
    throw new Error('No accounts found')
  }
  const first = accountKeys[0]
  if (!first) {
    throw new Error('No accounts found')
  }

  const account = accounts[first]
  if (!account) {
    throw new Error('No accounts found')
  }
  return account
}

export function* getCurrentChainId() {
  const chainId = yield* select(
    (state: RootState) => state.chains.currentChainId
  )
  return chainId
}

export function* connect(
  requestId: string,
  chainId: string,
  senderTabId: number
) {
  // get chain id enum
  const chainIdEnum = yield* call(getChainIdFromString, chainId)
  if (!chainIdEnum) {
    throw new Error(`Invalid chainId: ${chainId}`)
  }

  // get provider
  const provider = yield* call(getProvider, chainIdEnum)
  yield* put(setCurrentChain({ chainId: chainIdEnum }))

  // prepare dapp response
  const response: ConnectResponse = {
    type: DappResponseType.ConnectResponse,
    requestId,
    providerUrl: provider.connection.url,
  }
  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* changeChain(
  requestId: string,
  chainId: string,
  senderTabId: number
) {
  const chainIdEnum = yield* call(getChainIdFromString, chainId)
  if (!chainIdEnum) {
    throw new Error(`Invalid chainId: ${chainId}`)
  }

  // get provider
  const provider = yield* call(getProvider, chainIdEnum)
  yield* put(setCurrentChain({ chainId: chainIdEnum }))

  const newChainId = yield* call(getCurrentChainId)
  const response: ChangeChainResponse = {
    type: DappResponseType.ChainChangeResponse,
    requestId,
    providerUrl: provider.connection.url,
    chainId: newChainId.toString(),
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* handleSignMessage(
  account: Account,
  requestId: string,
  messageHex: string,
  senderTabId: number
) {
  // Get currently selected chain id
  const chainId = yield* call(getCurrentChainId)
  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, chainId)

  if (account.type !== AccountType.SignerMnemonic)
    throw new Error('Account must support signing')

  const signature = yield* call(
    signMessage,
    messageHex,
    account,
    signerManager,
    provider
  )

  const response: SignMessageResponse = {
    type: DappResponseType.SignMessageResponse,
    requestId,
    signature,
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* handleSignTypedData(
  account: Account,
  requestId: string,
  typedData: string,
  senderTabId: number
) {
  // Get currently selected chain id
  const chainId = yield* call(getCurrentChainId)
  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, chainId)

  if (account.type !== AccountType.SignerMnemonic)
    throw new Error('Account must support signing')

  const signature = yield* call(
    signTypedDataMessage,
    typedData,
    account,
    signerManager,
    provider
  )
  const response: SignTypedDataResponse = {
    type: DappResponseType.SignTypedDataResponse,
    requestId,
    signature,
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

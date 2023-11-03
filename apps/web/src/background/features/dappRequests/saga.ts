import { Provider, TransactionResponse } from '@ethersproject/providers'
import { createAction } from '@reduxjs/toolkit'
import { ethers, providers } from 'ethers'
import {
  selectDappChainId,
  selectDappConnectedAddresses,
  selectDappOrderedConnectedAddresses,
} from 'src/background/features/dapp/selectors'
import {
  removeDappConnection,
  saveDappChain,
  saveDappConnection,
  updateDappConnectedAddress,
} from 'src/background/features/dapp/slice'
import { appSelect } from 'src/background/store'
import { sendMessageToActiveTab, sendMessageToSpecificTab } from 'src/background/utils/messageUtils'
import {
  ExtensionChainChange,
  ExtensionToDappRequestType,
  UpdateConnectionRequest,
} from 'src/types/requests'
import { call, put, select, take } from 'typed-redux-saga'
import { ChainId } from 'wallet/src/constants/chains'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts//types'
import { getProvider, getSignerManager } from 'wallet/src/features/wallet/context'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { signMessage, signTypedDataMessage } from 'wallet/src/features/wallet/signing/signing'
import { hexlifyTransaction } from 'wallet/src/utils/transaction'
import {
  AccountResponse,
  ChangeChainResponse,
  DappRequestType,
  DappResponseType,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTypedDataRequest,
  SignTypedDataResponse,
} from './dappRequestTypes'
import { dappRequestActions, DappRequestStoreItem } from './slice'
import { extractBaseUrl } from './utils'

const DEFAULT_IMAGE_PATH = 'assets/default.png'
const SUCCESS_IMAGE_PATH = 'assets/success.png'
const FAIL_IMAGE_PATH = 'assets/fail.png'
const PENDING_IMAGE_PATH = 'assets/pending.png'

export type DappRequestSagaParams = Omit<DappRequestStoreItem, 'account' | 'dappUrl'>

export const addRequest = createAction<DappRequestSagaParams>(`dappRequest/handleRequest`)
export const confirmRequest = createAction<DappRequestStoreItem>(`dappRequest/confirmRequest`)
export const rejectRequest = createAction<DappRequestStoreItem>(`dappRequest/rejectRequest`)

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
  const activeAccount = yield* appSelect(selectActiveAccount)
  if (!activeAccount) {
    // TODO(EXT-341): reject with error code 4900 (disconnected)
    throw new Error('No active account')
  }

  const tab = yield* call(chrome.tabs.get, requestParams.senderTabId)
  const dappUrl = extractBaseUrl(tab.url)
  const connectedWallets = (yield* select(selectDappConnectedAddresses(dappUrl || ''))) || []

  // TODO(EXT-341): it also has to be connected to the correct chain. If its not then reject with error 4901
  const isConnectedToDapp = connectedWallets.includes(activeAccount.address)

  const requestForStore: DappRequestStoreItem = {
    dappRequest: requestParams.dappRequest,
    senderTabId: requestParams.senderTabId,
    account: activeAccount,
    dappUrl,
  }

  // If the dapp is not connected to the active account the only request it can make is to GetAccountRequest.
  // Everything else is rejected. If the dapp is connected to the active account then it can connect to the
  // account without confirmation and for any other transactions it will require confirmation.
  if (
    !isConnectedToDapp &&
    requestForStore.dappRequest.type !== DappRequestType.GetAccountRequest
  ) {
    // TODO(EXT-341): reject with error code 4100 (unauthorized)
    // TODO(EXT-359): show a warning when the active account is different.
    // Only reject if there are no wallets connected.
    yield* put(rejectRequest(requestForStore))
  } else if (
    isConnectedToDapp &&
    (requestForStore.dappRequest.type === DappRequestType.GetAccount ||
      requestForStore.dappRequest.type === DappRequestType.GetAccountRequest)
  ) {
    yield* put(confirmRequest(requestForStore))
  } else {
    yield* put(dappRequestActions.add(requestForStore))
  }
}

export function* sendTransaction({
  dappRequest,
  account,
  senderTabId,
  dappUrl,
}: DappRequestStoreItem) {
  const transactionRequest = (dappRequest as SendTransactionRequest).transaction
  const requestId = dappRequest.requestId

  const chainId = (yield* select(selectDappChainId(dappUrl || ''))) || ChainId.Mainnet
  // Sign and send the transaction
  const provider = yield* call(getProvider, chainId)
  const signerManager = yield* call(getSignerManager)

  if (account.type !== AccountType.SignerMnemonic) throw new Error('Account must support signing')

  const transactionResponse = yield* call(
    signAndSendTransaction,
    transactionRequest,
    account,
    provider,
    signerManager
  )

  yield* call(handleTransactionResponse, transactionResponse, provider, requestId, senderTabId)

  return transactionResponse
}

/**
 * Gets the active account, and returns the account address, chainId, and providerUrl.
 * Chain id + provider url are from the last connected chain for the dApp and wallet. If this has not been set, it will be the default chain and provider.
 * @param requestId
 * @param senderTabId
 */
export function* getAccount(
  requestId: string,
  senderTabId: number,
  dappUrl: string | undefined,
  newRequest = false
) {
  const activeAccount = yield* appSelect(selectActiveAccount)
  if (!activeAccount) {
    throw new Error('No active account')
  }

  if (dappUrl && newRequest) {
    yield* put(
      saveDappConnection({
        dappUrl,
        walletAddress: activeAccount.address,
      })
    )
  }

  const chainId = (dappUrl && (yield* select(selectDappChainId(dappUrl)))) || ChainId.Mainnet
  const provider = yield* call(getProvider, chainId)
  const connectedWallets =
    (dappUrl && (yield* select(selectDappOrderedConnectedAddresses(dappUrl)))) || []

  const response: AccountResponse = {
    type: DappResponseType.AccountResponse,
    requestId,
    connectedAddresses: connectedWallets,
    chainId,
    providerUrl: provider.connection.url,
  }
  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

async function handleTransactionResponse(
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
  await onTransactionSentToChain(transactionResponse, provider)
  sendMessageToSpecificTab(response, senderTabId)
}

export async function signAndSendTransaction(
  request: providers.TransactionRequest,
  account: Account,
  provider: providers.Provider,
  signerManager: SignerManager
): Promise<ethers.providers.TransactionResponse> {
  const signer = await signerManager.getSignerForAccount(account)
  const connectedSigner = signer.connect(provider)
  const hexRequest = hexlifyTransaction(request)
  const populatedRequest = await connectedSigner.populateTransaction(hexRequest)
  const signedTransaction = await connectedSigner.signTransaction(populatedRequest)
  const transactionResponse = await provider.sendTransaction(signedTransaction)
  return transactionResponse
}

async function onTransactionSentToChain(
  transactionResponse: TransactionResponse,
  provider: Provider
): Promise<void> {
  // Update chrome icon
  await chrome.action.setIcon({
    path: PENDING_IMAGE_PATH,
  })

  // Listen for transaction receipt
  const receipt = await provider.waitForTransaction(transactionResponse.hash, 1)

  if (receipt.status === 1) {
    // TODO: Clean up chrome notifications
    await chrome.action.setIcon({
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
    await chrome.action.setIcon({
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
  setTimeout(async () => {
    await chrome.action.setIcon({
      path: DEFAULT_IMAGE_PATH,
    })
  }, 15000)
}

export function* changeChain(
  requestId: string,
  chainId: ChainId,
  senderTabId: number,
  dappUrl: string | undefined
) {
  const provider = yield* call(getProvider, chainId)
  if (dappUrl) {
    yield* put(saveDappChain({ dappUrl, chainId }))
  }

  const response: ChangeChainResponse = {
    type: DappResponseType.ChainChangeResponse,
    requestId,
    providerUrl: provider.connection.url,
    chainId,
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* handleSignMessage({
  dappRequest,
  account,
  senderTabId,
  dappUrl,
}: DappRequestStoreItem) {
  const requestId = dappRequest.requestId
  const messageHex = (dappRequest as SignMessageRequest).messageHex

  // Get currently selected chain id
  const chainId = (yield* select(selectDappChainId(dappUrl || ''))) || ChainId.Mainnet
  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, chainId)

  if (account.type !== AccountType.SignerMnemonic) throw new Error('Account must support signing')

  const signature = yield* call(signMessage, messageHex, account, signerManager, provider)

  const response: SignMessageResponse = {
    type: DappResponseType.SignMessageResponse,
    requestId,
    signature,
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* handleSignTypedData({
  dappRequest,
  account,
  senderTabId,
  dappUrl,
}: DappRequestStoreItem) {
  const requestId = dappRequest.requestId
  const typedData = (dappRequest as SignTypedDataRequest).typedData

  // Get currently selected chain id
  const chainId = (yield* select(selectDappChainId(dappUrl || ''))) ?? ChainId.Mainnet
  const signerManager = yield* call(getSignerManager)
  const provider = yield* call(getProvider, chainId)

  if (account.type !== AccountType.SignerMnemonic) throw new Error('Account must support signing')

  const signature = yield* call(signTypedDataMessage, typedData, account, signerManager, provider)
  const response: SignTypedDataResponse = {
    type: DappResponseType.SignTypedDataResponse,
    requestId,
    signature,
  }

  yield* call(sendMessageToSpecificTab, response, senderTabId)
}

export function* extensionRequestWatcher() {
  while (true) {
    const { payload, type } = yield* take([
      saveDappChain,
      saveDappConnection,
      removeDappConnection,
      updateDappConnectedAddress,
    ])

    switch (type) {
      case saveDappChain.type:
        yield* call(changeChainFromExtension, payload.dappUrl, payload.chainId)
        break
      case saveDappConnection.type:
      case removeDappConnection.type:
      case updateDappConnectedAddress.type:
        yield* call(updateConnectionsFromExtension, payload.dappUrl)
        break
    }
  }
}

function* changeChainFromExtension(dappUrl: string, chainId: ChainId) {
  const provider = yield* call(getProvider, chainId)
  yield* put(saveDappChain({ dappUrl, chainId }))

  const response: ExtensionChainChange = {
    type: ExtensionToDappRequestType.SwitchChain,
    providerUrl: provider.connection.url,
    chainId,
  }
  yield* call(sendMessageToActiveTab, response)
}

function* updateConnectionsFromExtension(dappUrl: string) {
  const connectedWallets = (yield* select(selectDappOrderedConnectedAddresses(dappUrl))) || []

  const response: UpdateConnectionRequest = {
    type: ExtensionToDappRequestType.UpdateConnections,
    addresses: connectedWallets,
  }
  yield* call(sendMessageToActiveTab, response)
}

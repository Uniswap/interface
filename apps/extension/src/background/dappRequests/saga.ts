import { Provider, TransactionResponse } from '@ethersproject/providers'
import { createAction } from '@reduxjs/toolkit'
import { ChainId } from 'app/src/features/chains/chains'
import {
  AccountResponse,
  DappResponseType,
  SendTransactionResponse,
} from 'app/src/features/dappRequests/dappRequestTypes'
import {
  DappRequestStoreItem,
  dappRequestActions,
} from 'app/src/features/dappRequests/slice'
import { getProvider, getSignerManager } from 'app/src/features/wallet/context'
import { SignerManager } from 'app/src/features/wallet/signing/SignerManager'
import { Account, AccountType } from 'app/src/features/wallet/types'
import { RootState, appSelect } from 'app/src/state'
import { sendMessageToSpecificTab } from 'app/src/utils/messageUtils'
import { hexlifyTransaction } from 'app/src/utils/transaction'
import { ethers, providers } from 'ethers'
import { call, put, select, take } from 'typed-redux-saga'

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

  yield* put(dappRequestActions.add(requestForStore))
}

export function* sendTransaction(
  transactionRequest: ethers.providers.TransactionRequest,
  account: Account,
  requestId: string,
  senderTabId: number
) {
  // TODO: Get chainId based on current wallet configuration
  const chainId = ChainId.Goerli

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
  sendMessageToSpecificTab(response, senderTabId)
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

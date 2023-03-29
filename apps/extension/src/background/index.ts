import {
  ContentScriptRequest,
  ContentScriptResponse,
  Message,
  RequestType,
  ResponseType,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  ValidatePasswordRequest,
  ValidatePasswordResponse,
} from '../types/messageTypes'
import { ethers, providers, Wallet } from 'ethers'
import { decryptPassword } from './utils/encryptionUtils'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { initStore } from './store'
import { sendMessageToSpecificTab } from './utils/messageUtils'
import {
  TransactionDetails,
  TransactionType,
  TransactionWindowDisplay,
  TransactionWindowResponse,
} from '../types/transactionTypes'
import { v4 as uuidv4 } from 'uuid'
import { logger } from 'app/src/features/logger/logger'

logger.info('background', 'main', 'initialized')

initStore()

// TODO - make the provider initalization a singleton instance
const infuraProvider = new providers.InfuraProvider(
  'goerli',
  'b14063d3418c40ec984f510cf64083b4'
)
// TODO - make the provider initalization a singleton instance
let signer: ethers.Signer | null = null
signer = new ethers.Wallet(
  Wallet.fromMnemonic(
    process.env.TEST_SEED_PHRASE ||
      'primary claw weird neck fly keep equal garden float below bridge market'
  ).privateKey,
  infuraProvider
)
// TODO: Look into using web-ext-redux instead for this:

// Specifically listen for messages from content scripts
chrome.runtime.onMessage.addListener(
  (
    request: ContentScriptRequest,
    _sender,
    sendResponse: (response: ContentScriptResponse) => void
  ) => {
    // TODO: Add sender validation

    switch (request.type) {
      case RequestType.SignMessage: {
        requestSignMessage(request as SignMessageRequest, sendResponse)
        break
      }
      case RequestType.SignTransaction: {
        requestSignTransaction(request as SignTransactionRequest, sendResponse)
        break
      }
      case RequestType.SendTransaction: {
        requestSendTransaction(request as SendTransactionRequest, sendResponse)
        break
      }
    }
    return true // We return true here to indicate that we will call sendResponse asynchronously
  }
)

// Specifically listen for messages from popup
chrome.runtime.onMessage.addListener(
  (request: Message, _sender, sendResponse: (response: unknown) => void) => {
    // TODO: Add sender validation

    switch (request.type) {
      case RequestType.ValidatePassword: {
        requestValidatePassword(
          request as ValidatePasswordRequest,
          sendResponse
        )
      }
    }
    return true // We return true here to indicate that we will call sendResponse asynchronously
  }
)

async function requestSignMessage(
  request: SignMessageRequest,
  sendResponse: (response: SignMessageResponse) => void
) {
  if (!signer) {
    throw new Error('Import wallet first')
  }

  // TODO: Add confirmation before signing message
  const signedMessage = await signer.signMessage(request.messageHex)
  sendResponse({
    type: ResponseType.SignMessageResponse,
    signedMessage,
  })
}

async function requestSignTransaction(
  request: SignTransactionRequest,
  sendResponse: (response: SignTransactionResponse) => void
) {
  if (!signer) {
    throw new Error('Import wallet first')
  }

  // TODO: Add confirmation before signing message and send rejection response otherwise
  const signedTxHash = await signer.signTransaction(request.transaction)
  sendResponse({
    type: ResponseType.SignTransactionResponse,
    signedTransactionHash: signedTxHash,
  })
}

async function requestSendTransaction(
  message: SendTransactionRequest,
  sendResponse: (response: SendTransactionResponse) => void
) {
  if (!signer) {
    throw new Error('Import wallet first')
  }

  // TODO -  Get transaction type based on transaction data

  const confirmed = await confirmOrRejectTransaction({
    type: TransactionType.SwapApproval,
    title: 'Swap',
    message: 'You sure?',
    id: uuidv4(),
  })

  if (!confirmed) {
    logger.info(
      'background',
      'requestSendTransaction',
      'Transaction not confirmed'
    )
    // TODO - send response back to content script with rejection
    return
  }

  const sentTx = await signer.sendTransaction(message.transaction)
  sendResponse({
    type: ResponseType.SendTransactionResponse,
    transaction: sentTx,
  })
  onTransactionSent(sentTx)
}

async function requestValidatePassword(
  request: ValidatePasswordRequest,
  sendResponse: (response?: ValidatePasswordResponse) => void
) {
  const {
    iv: ivStr,
    salt: saltStr,
    pw,
  } = await chrome.storage.local.get(['iv', 'pw', 'salt'])

  const iv = new Uint8Array(ivStr.split(','))
  const salt = new Uint8Array(saltStr.split(','))
  const cipherText = new Uint8Array(pw.split(','))

  const isCorrectPW = await decryptPassword(
    request.passwordAttempt,
    cipherText,
    iv,
    salt
  )
  sendResponse({
    type: ResponseType.ValidatePasswordResponse,
    isValid: isCorrectPW,
  })
}

function onTransactionSent(transactionResponse: TransactionResponse): void {
  // Update chrome icon
  chrome.action.setIcon({
    path: 'assets/pending.png',
  })

  // Listen for transaction receipt
  signer?.provider
    ?.waitForTransaction(transactionResponse.hash, 1)
    .then((receipt) => {
      if (receipt.status === 1) {
        chrome.action.setIcon({
          path: 'assets/success.png',
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
          path: 'assets/fail.png',
        })
        // Send chrome notification that transaction failed
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'assets/fail.png',
          title: 'Transaction failed',
          message: `Transaction ${transactionResponse.hash} failed`,
          buttons: [
            {
              title: 'Retry',
            },
          ],
        })
      }
      setTimeout(() => {
        chrome.action.setIcon({
          path: 'assets/default.png',
        })
      }, 7000)
    })
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

function confirmOrRejectTransaction(transaction: TransactionDetails) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<boolean>(async (resolve) => {
    // open a custom chrome window to confirm transactions before sending
    const currentWindowWidth = await chrome.windows
      .getCurrent()
      .then((window) => window.width)

    const popupWindow = chrome.windows.create({
      url: 'transactionWindow.html',
      type: 'popup',
      width: 250,
      height: 400,
      left: (currentWindowWidth || 2000) - 200,
      top: 100,
    })

    let windowId: number | undefined
    popupWindow.then(async (window) => {
      windowId = window.id
      await delay(500) // TODO remove hacky delay in case the popup window hasn't started listening yet and save information elsewhere

      const windowMessage: TransactionWindowDisplay = {
        type: RequestType.TransactionWindowDisplay,
        transactionType: transaction.type,
        transactionId: transaction.id,
        message: transaction.message,
        title: transaction.title,
      }

      sendMessageToSpecificTab(windowMessage, window.tabs?.[0]?.id || 0)
    })

    chrome.runtime.onMessage.addListener(
      (response: TransactionWindowResponse) => {
        if (!windowId) {
          throw new Error('Window ID not set')
        }

        if (
          response.type === RequestType.ConfirmTransaction &&
          response.transactionId === transaction.id
        ) {
          resolve(true)
          chrome.windows.remove(windowId)
          return
        } else if (
          response.type === RequestType.RejectTransaction &&
          response.transactionId === transaction.id
        ) {
          resolve(false)
          chrome.windows.remove(windowId)
          return
        }
      }
    )
  })
}

import { Message, MessageType, PortName, TransactionType } from '../types'
import { ethers, providers, Wallet } from 'ethers'
import { decryptPassword, sendMessageToSpecificTab } from './utils'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { initStore } from './store'
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
  Wallet.fromMnemonic(process.env.TEST_SEED_PHRASE || '').privateKey,
  infuraProvider
)

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    // TODO: Add sender validation

    switch (message.type) {
      case MessageType.SignMessage: {
        // To be implemented
        break
      }
      case MessageType.SignTransaction: {
        // To be implemented
        break
      }
      case MessageType.SendTransaction: {
        onSendTransactionMessage(message, sendResponse)
        break
      }
      case MessageType.ValidatePassword: {
        onValidatePasswordMessage(message, sendResponse)
        break
      }
    }
    return true
  }
)

async function onValidatePasswordMessage(
  message: Message,
  sendResponse: (response?: unknown) => void
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
    message.data.message,
    cipherText,
    iv,
    salt
  )
  sendResponse({ isValid: isCorrectPW })
}

function onTransactionSent(transactionResponse: TransactionResponse): void {
  // Update chrome icon
  chrome.action.setIcon({
    path: 'pending.png',
  })

  // Listen for transaction receipt
  signer?.provider
    ?.waitForTransaction(transactionResponse.hash, 1)
    .then((receipt) => {
      if (receipt.status === 1) {
        chrome.action.setIcon({
          path: 'success.png',
        })

        // Send chrome notification that transaction was successful
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'success.png',
          title: 'Transaction successful',
          message: `Transaction ${transactionResponse.hash} was successful`,
        })
      } else {
        chrome.action.setIcon({
          path: 'fail.png',
        })
        // Send chrome notification that transaction failed
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'fail.png',
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
          path: 'default.png',
        })
      }, 7000)
    })
}

function confirmSendTransaction() {
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

    let windowId: number | null | undefined = null
    popupWindow.then(async (window) => {
      windowId = window.id
      await delay(500) // TODO remove hacky delay in case the popup window hasn't started listening yet and save information elsewhere

      sendMessageToSpecificTab(
        {
          type: MessageType.TransactionDetails,
          data: {
            type: TransactionType.SwapApproval,
            title: 'Swap',
            message: 'You sure?',
            id: Math.random().toString(36).substring(7),
          },
        },
        window.tabs?.[0]?.id || 0
      )
    })

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === MessageType.ConfirmSendTransaction) {
        resolve(true)
        if (!windowId) return
        chrome.windows.remove(windowId)
      }
    })
  })
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

async function onSendTransactionMessage(
  message: {
    data: {
      data: {
        transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>
      }
    }
  },
  sendResponse: (response: any) => void
) {
  if (!signer) {
    throw new Error('Import wallet first')
  }

  const confirmed = await confirmSendTransaction()
  if (!confirmed) {
    logger.info('background', 'sendTransaction', 'Transaction not confirmed')
    sendResponse({ status: 'fail', data: 'Transaction not confirmed' })
    return
  }

  const sentTx = await signer.sendTransaction(message.data.data.transaction)
  sendResponse({ status: 'success', data: sentTx })
  onTransactionSent(sentTx)
}

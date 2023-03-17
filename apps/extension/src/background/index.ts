import { Message, MessageType, PortName, TransactionType } from '../types'
import { createStore } from 'app/src/state'
import { aliases } from './aliases'
import { alias, wrapStore } from 'webext-redux'
import { ethers, providers, Wallet } from 'ethers'
import { decryptPassword } from './utils'
import { TransactionResponse } from '@ethersproject/abstract-provider'

console.log('background: init')

// Since we are in a service worker, this is not persistent
// and this will be reset to false, as expected, whenever
// the service worker wakes up from idle.
const isInitialized = false

initStore()

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

function initStore() {
  // Listen to incoming connections from content scripts or popup.
  // Triggers whenever extension "wakes up" from idle.
  // With Manifest V3, we must reinitialize the store from storage each time.
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name === PortName.Popup) {
      chrome.storage.local.get('state', (storage) => {
        if (!isInitialized) {
          const beforeMiddleware = [alias(aliases)]

          const store = createStore({
            preloadedState: storage.state,
            beforeMiddleware,
          })

          wrapStore(store, { portName: PortName.Store })
        }

        // 2. sends a message to notify store is ready
        chrome.runtime.sendMessage({
          type: 'STORE_INITIALIZED',
        })
      })
    }
  })
}

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
  async (message: Message, _sender, sendResponse) => {
    // Check if the message is a valid message
    // TODO check if this is necessary when we have message passing type marked
    if ((message as Message) === undefined) return

    switch (message.type) {
      case MessageType.SignMessage: {
        if (!signer) {
          throw new Error('Import wallet first')
        }
        break
      }

      case MessageType.SignTransaction: {
        if (!signer) {
          throw new Error('Import wallet first')
        }
        break
      }

      case MessageType.SendTransaction: {
        if (!signer) {
          throw new Error('Import wallet first')
        }

        // We need to get the active tab id before opening the popup
        const activeTabId = await new Promise<number>((resolve) => {
          chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab?.id) {
              resolve(tab.id)
            }
          })
        })

        const confirmed = await confirmSendTransaction()
        if (!confirmed) {
          console.log('Transaction not confirmed')
          // TODO: Send transaction not confirmed message to provider
          return
        }

        const sentTx = await signer.sendTransaction(
          message.data.data.transaction
        )
        onTransactionSent(sentTx, activeTabId)
        // return true - TODO: check if we need this / lets us use sendResponse to the tab

        break
      }
      case MessageType.ValidatePassword: {
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
    }
  }
)

function sendMessageToActiveTab(message: Message) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, message)
    }
  })
}

function sendMessageToSpecificTab(message: Message, tabId: number) {
  chrome.tabs.sendMessage(tabId, message)
}

function onTransactionSent(
  transactionResponse: TransactionResponse,
  tabId: number
): void {
  // Update chrome icon
  chrome.action.setIcon({
    path: 'pending.png',
  })

  sendMessageToSpecificTab(
    {
      type: MessageType.SendTransactionResponse,
      data: transactionResponse,
    },
    tabId
  )

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

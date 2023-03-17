import { Message, MessageType, PortName } from '../types'
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

        // TODO:
        // Prompt user to confirm transaction in a notification
        // If user confirms, send transaction
        console.log(
          'transaction about to send is',
          message.data.data.transaction
        )
        const sentTx = await signer.sendTransaction(
          message.data.data.transaction
        )
        onTransactionSent(sentTx)
        // return true // check if we need this / lets us use sendResponse to the tab

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

function onTransactionSent(transactionResponse: TransactionResponse): void {
  // Update chrome icon
  chrome.action.setIcon({
    path: 'pending.png',
  })
  sendMessageToActiveTab({
    type: MessageType.SendTransactionResponse,
    data: transactionResponse,
  })

  // Listen for transaction receipt
  signer?.provider
    ?.waitForTransaction(transactionResponse.hash, 1)
    .then((receipt) => {
      console.log('Transaction receipt', receipt)
      if (receipt.status === 1) {
        chrome.action.setIcon({
          path: 'success.png',
        })
      } else {
        chrome.action.setIcon({
          path: 'fail.png',
        })
      }
      setTimeout(() => {
        chrome.action.setIcon({
          path: 'default.png',
        })
      }, 7000)
    })
}

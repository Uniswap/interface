/**
 * Content script that is injected into any webpage while our extension is installed.
 */

import { MessageType } from '../types'

const container = document.head || document.documentElement
const scriptTag = document.createElement('script')

// The script tag is inserted into the DOM and then removed.
scriptTag.src = chrome.runtime.getURL('injected.js')
container.appendChild(scriptTag)
scriptTag.onload = () => {
  if (scriptTag.parentNode) {
    scriptTag.parentNode.removeChild(scriptTag)
  }
}

// eslint-disable-next-line no-console
console.log('[provider script] attached!')

const chromeMessageToWindowMessageTypes = [
  MessageType.SendTransactionResponse,
  MessageType.SignMessageResponse,
  MessageType.SendTransactionResponse,
]

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(
    '[provider script] Listening for response',
    message,
    sender,
    sendResponse
  )

  if (chromeMessageToWindowMessageTypes.includes(message.type)) {
    console.log('response is')
    window.postMessage({ type: message.type, data: message.data }, '*')
  }
})

const windowMessageToChromeMessageTypes = [
  MessageType.SendTransaction,
  MessageType.SignTransaction,
  MessageType.SignMessage,
]
window.addEventListener('message', function (event) {
  // We only accept messages from ourselves
  if (event.source != window) {
    return
  }

  if (windowMessageToChromeMessageTypes.includes(event.data.type)) {
    console.log(
      '[provider script] Payload to send to background is',
      event.data
    )
    chrome.runtime.sendMessage({ type: event.data.type, data: event.data })
  }
})

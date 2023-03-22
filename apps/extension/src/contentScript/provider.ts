/**
 * Content script that is injected into any webpage while our extension is installed.
 */

import { Message, MessageType } from '../types'

const container = document.head || document.documentElement
const scriptTag = document.createElement('script')

// The script tag is inserted into the DOM and then removed.
// injected.js sets up the injected provider for use at window.ethereum
scriptTag.src = chrome.runtime.getURL('injected.js')
container.appendChild(scriptTag)
scriptTag.onload = () => {
  if (scriptTag.parentNode) {
    scriptTag.parentNode.removeChild(scriptTag)
  }
}

// eslint-disable-next-line no-console
console.log('[provider script] attached!')

// New message types should be added here, and mapped to the corresponding response type
const requestToResponseMap = new Map<MessageType, MessageType>([
  [MessageType.SendTransaction, MessageType.SendTransactionResponse],
  [MessageType.SignTransaction, MessageType.SignTransactionResponse],
  [MessageType.SignMessage, MessageType.SignMessageResponse],
])

window.addEventListener('message', function (event) {
  // We only accept messages from ourselves
  if (event.source !== window && !isValidMessage(event.data)) {
    return
  }

  const request = event.data as Message

  // Check for a valid request type since any site can post a message to the window
  if ([...requestToResponseMap.keys()].includes(request.type)) {
    console.log(
      '[provider script] Payload to send to background is',
      event.data
    )

    chrome.runtime.sendMessage({ type: request.type, data: request.data }).then(
      (response: unknown) => {
        // Simply forwards the response from the background script to the content script.
        // NOTE: This could be a success or rejection response, filtered in the next step
        console.log('[provider script] Response from background is', response)

        // We use event.source here to make sure we send the response back to the original source, but this functions the same as window.postMessage
        event.source?.postMessage({
          type: requestToResponseMap.get(request.type),
          data: response,
        })
      },
      (error: unknown) => {
        console.log('[provider script] Error from background is', error)
      }
    )
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidMessage(message: any): message is Message {
  return (
    message &&
    typeof message === 'object' &&
    'type' in message &&
    'data' in message
  )
}

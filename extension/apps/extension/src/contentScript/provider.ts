import {
  BaseDappRequest,
  BaseDappResponse,
  DappRequestType,
  Message,
} from 'app/src/features/dappRequests/dappRequestTypes'
import { logger } from 'app/src/features/logger/logger'
import { PortName } from '../types'

/**
 * Content script that is injected into any webpage while our extension is installed.
 */
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
window.addEventListener('message', contentScriptListener)

chrome.runtime.connect({ name: PortName.ContentScript })
chrome.runtime.onMessage.addListener((req) => {
  logger.debug(
    'contentScript',
    'listener',
    `Received ${req.action} from ${req.portName}`
  )

  // We wait to inject the script until the background is ready to receive messages
  if (req.action === 'storeReady' && req.portName === 'store') {
    logger.info('provider.ts', 'main', 'Content script loaded')
  }
})

/* Functions */

function contentScriptListener(event: MessageEvent): void {
  // New request and response types should be added in [types/index.ts]

  // We only accept messages from ourselves
  if (event.source !== window && !isValidContentScriptRequest(event.data)) {
    return
  }

  const request = event.data as BaseDappRequest

  // Check for a valid request type since any site can post a message to the window
  if (Object.values(DappRequestType).includes(request.type)) {
    logger.info(
      'provider.ts',
      'contentScriptListener',
      'Payload to send to background is: ',
      event.data
    )

    chrome.runtime.onMessage.addListener(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (message: any, _sender, _sendResponse) => {
        logger.info(
          'provider.ts',
          'contentScriptListener',
          'Response from background is: ',
          message
        )
        // TODO: Add sender validation
        if (!isValidContentScriptResponse(message)) return

        // We use event.source here to make sure we send the response back to the original source, but this functions the same as window.postMessage
        event.source?.postMessage(message)
      }
    )

    chrome.runtime.sendMessage<BaseDappRequest, BaseDappResponse>(request)
    logger.info(
      'provider.ts',
      'contentScriptListener',
      'Message sent to background'
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidMessage(message: any): message is Message {
  return message && typeof message === 'object' && 'type' in message
}

function isValidContentScriptRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): message is BaseDappRequest {
  if ((message as BaseDappRequest) !== undefined) {
    return isValidMessage(message)
  }
  return false
}

function isValidContentScriptResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): message is BaseDappResponse {
  if ((message as BaseDappResponse) !== undefined) {
    return isValidMessage(message)
  }
  return false
}

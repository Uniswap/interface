import { logger } from 'app/src/features/logger/logger'
import {
  ContentScriptRequest,
  contentScriptRequestToResponseMap,
  ContentScriptResponse,
  Message,
  RequestType,
} from '../types/messageTypes'

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

logger.info('provider.ts', 'main', 'Content script loaded')
window.addEventListener('message', contentScriptListener)

/* Functions */

function contentScriptListener(event: MessageEvent): void {
  // New request and response types should be added in [types/index.ts]

  // TODO: Add generic function to validate message types
  // We only accept messages from ourselves
  if (event.source !== window && !isValidContentScriptRequest(event.data)) {
    return
  }

  const request = event.data as ContentScriptRequest

  // Check for a valid request type since any site can post a message to the window
  if ([...contentScriptRequestToResponseMap.keys()].includes(request.type)) {
    logger.info(
      'provider.ts',
      'contentScriptListener',
      'Payload to send to background is: ',
      event.data
    )

    chrome.runtime
      .sendMessage<ContentScriptRequest, ContentScriptResponse>(request)
      .then(
        (response: ContentScriptResponse) => {
          // Simply forwards the response from the background script to the content script.
          // NOTE: This could be a success or rejection response, filtered in the next step
          logger.info(
            'provider.ts',
            'contentScriptListener',
            'Response from background is: ',
            event.data
          )

          // We use event.source here to make sure we send the response back to the original source, but this functions the same as window.postMessage
          event.source?.postMessage(response)
        },
        (error: unknown) => {
          logger.error(
            'provider.ts',
            'contentScriptListener',
            'Error from background is: ',
            error
          )
        }
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
): message is ContentScriptRequest {
  if ((message as RequestType) !== undefined) {
    return isValidMessage(message)
  }
  return false
}

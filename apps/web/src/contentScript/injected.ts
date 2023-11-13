import {
  BaseDappRequest,
  BaseDappResponse,
  DappRequestType,
  DappResponseType,
} from 'src/background/features/dappRequests/dappRequestTypes'
import { isValidMessage } from 'src/background/utils/messageUtils'
import { BaseExtensionRequest, ExtensionToDappRequestType } from 'src/types/requests'
import { logger } from 'utilities/src/logger/logger'
import { InjectedAssetsManager } from './InjectedAssetsManager'

const extensionId = chrome.runtime.id

InjectedAssetsManager.init()

// TODO: Migrate these to onConnect listeners to avoid sendResponse problems when multiple listeners are active
addDappToExtensionRoundtripListener()
addExtensionRequestListener()

/* Functions */
// New request and response types should be added in types/requests.ts or features/dappRequests/dappRequestTypes.ts
function dappRequestListener(event: MessageEvent): void {
  // We only accept valid messages from ourselves
  if (
    event.source !== window ||
    !isValidMessage<BaseDappRequest>(Object.values(DappRequestType), event.data)
  ) {
    return
  }

  chrome.runtime.onMessage.addListener((message, sender: chrome.runtime.MessageSender) => {
    if (
      sender.id !== extensionId ||
      !isValidMessage<BaseDappResponse>(Object.values(DappResponseType), message)
    )
      return

    logger.info('injected.ts', 'dappRequestListener', 'Response from background is: ', message)
    // We use event.source here to make sure we send the response back to the original source, but this functions the same as window.postMessage
    event.source?.postMessage(message)
  })

  const request = event.data as BaseDappRequest
  logger.info('injected.ts', 'dappRequestListener', 'Payload to send to background is: ', request)
  chrome.runtime.sendMessage<BaseDappRequest, BaseDappResponse>(request).catch((error) => {
    logger.error(error, { tags: { file: 'injected.ts', function: 'dappRequestListener' } })
  })
}

function addDappToExtensionRoundtripListener(): void {
  window.addEventListener('message', dappRequestListener)
}

/**
 * Pass on messages from the extension to the page
 */
function addExtensionRequestListener(): void {
  chrome.runtime.onMessage.addListener((message, sender: chrome.runtime.MessageSender) => {
    if (
      sender.id !== extensionId &&
      isValidMessage<BaseExtensionRequest>(Object.values(ExtensionToDappRequestType), message)
    ) {
      return
    }

    logger.info(
      'injected.ts',
      'addExtensionRequestListener',
      'Message from background is: ',
      message
    )
    window.postMessage(message)
  })
}

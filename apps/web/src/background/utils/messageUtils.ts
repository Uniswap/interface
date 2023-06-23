import {
  DappResponseType,
  Message,
  TransactionRejectedResponse,
} from 'src/background/features/dappRequests/dappRequestTypes'

export function sendMessageToActiveTab(message: Message, onError?: () => void): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage<Message>(tab.id, message).catch(() => {
        onError?.()
        // If no listener is listening to the message, the promise will be rejected,
        // so we need to catch it unless there is an explicit error handler
      })
    }
  })
}

export function sendMessageToSpecificTab(message: Message, tabId: number): void {
  chrome.tabs.sendMessage<Message>(tabId, message)
}

export function sendRejectionToContentScript(requestId: string, senderTabId: number): void {
  const response: TransactionRejectedResponse = {
    type: DappResponseType.TransactionRejected,
    requestId,
  }
  sendMessageToSpecificTab(response, senderTabId)
}

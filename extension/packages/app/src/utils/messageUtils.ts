import {
  DappResponseType,
  Message,
  TransactionRejectedResponse,
} from '../features/dappRequests/dappRequestTypes'

export function sendMessageToActiveTab(message: Message) {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage<Message>(tab.id, message)
    }
  })
}

export function sendMessageToSpecificTab(message: Message, tabId: number) {
  chrome.tabs.sendMessage<Message>(tabId, message)
}

export function sendRejectionToContentScript(
  requestId: string,
  senderTabId: number
) {
  const response: TransactionRejectedResponse = {
    type: DappResponseType.TransactionRejected,
    requestId,
  }
  sendMessageToSpecificTab(response, senderTabId)
}

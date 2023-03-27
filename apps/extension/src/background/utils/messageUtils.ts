import { Message } from '../../types/messageTypes'

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

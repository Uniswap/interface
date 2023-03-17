import React from 'react'
import { createRoot } from 'react-dom/client'
import { MessageType } from './types'

const onConfirm = (): void => {
  chrome.runtime.sendMessage({
    type: MessageType.ConfirmSendTransaction,
    data: {},
  })
}

const onCancel = (): void => {
  chrome.runtime.sendMessage({
    type: MessageType.CancelSendTransaction,
    data: {},
  })
}

const container = window.document.querySelector('#root2')
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === MessageType.TransactionDetails) {
    const transactionDetails = message.data
    root.render(
      <React.StrictMode>
        <div>
          <h1>{transactionDetails?.title}</h1>
          <h2>{transactionDetails?.message}</h2>
          <button onClick={onConfirm}>Confirm</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </React.StrictMode>
    )
  }
})

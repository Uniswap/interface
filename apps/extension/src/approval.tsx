import React from 'react'
import { createRoot } from 'react-dom/client'
import { config, TamaguiProvider } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
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
        <TamaguiProvider config={config} defaultTheme="light">
          <div>
            <h1>{transactionDetails?.title}</h1>
            <h2>{transactionDetails?.message}</h2>
            <Button onPress={onConfirm}>Confirm</Button>
            <Button onPress={onCancel}>Cancel</Button>
          </div>
        </TamaguiProvider>
      </React.StrictMode>
    )
  }
})

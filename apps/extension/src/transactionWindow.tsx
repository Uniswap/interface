import TransactionContent from './transactionContent'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { config, TamaguiProvider } from 'ui/src'

const container = window.document.querySelector('#root')
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <TamaguiProvider config={config} defaultTheme="light">
      <TransactionContent />
    </TamaguiProvider>
  </React.StrictMode>
)

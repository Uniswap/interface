import TransactionContent from './transactionContent'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'app/src/provider/index'

const container = window.document.querySelector('#root')
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <Provider>
      <TransactionContent />
    </Provider>
  </React.StrictMode>
)

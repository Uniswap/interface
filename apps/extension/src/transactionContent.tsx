import { MessageType, TransactionDetails } from '../src/types'
import { useEffect, useState } from 'react'
import { Button } from 'ui/src/components/button/Button'

const onConfirm = (transactionId: string): void => {
  chrome.runtime.sendMessage({
    type: MessageType.ConfirmSendTransaction,
    data: { transactionId },
  })
}

const onCancel = (transactionId: string): void => {
  chrome.runtime.sendMessage({
    type: MessageType.CancelSendTransaction,
    data: { transactionId },
  })
}

export default function TransactionContent(): JSX.Element {
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionDetails>()

  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, _sender) => {
      // TODO: Check sender for safety
      if (request.type === MessageType.TransactionDetails) {
        setTransactionDetails(request.data as TransactionDetails)
      }
    })
  }, [])

  if (!transactionDetails) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h1>{transactionDetails?.title}</h1>
      <h2>{transactionDetails?.message}</h2>
      <h3>{transactionDetails?.id}</h3>
      <Button onPress={(): void => onConfirm(transactionDetails.id)}>
        Confirm
      </Button>
      <Button onPress={(): void => onCancel(transactionDetails.id)}>
        Cancel
      </Button>
    </div>
  )
}

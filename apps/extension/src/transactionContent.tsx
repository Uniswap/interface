import { MessageType, TransactionDetails } from './types'
import { useEffect, useState } from 'react'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'

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
    <Flex>
      <Text variant="headlineLarge">{transactionDetails?.title}</Text>
      <Text variant="bodyLarge">{transactionDetails?.message}</Text>
      <Text variant="bodyLarge">{transactionDetails?.id}</Text>
      <Button onPress={(): void => onConfirm(transactionDetails.id)}>
        Confirm
      </Button>
      <Button onPress={(): void => onCancel(transactionDetails.id)}>
        Cancel
      </Button>
    </Flex>
  )
}

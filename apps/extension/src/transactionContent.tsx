import { RequestType } from './types/messageTypes'
import { useEffect, useState } from 'react'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import {
  TransactionWindowDisplay,
  TransactionWindowResponse,
} from './types/transactionTypes'

const onConfirm = (transactionId: string): void => {
  chrome.runtime.sendMessage<TransactionWindowResponse>({
    type: RequestType.ConfirmTransaction,
    transactionId,
  })
}

const onCancel = (transactionId: string): void => {
  chrome.runtime.sendMessage<TransactionWindowResponse>({
    type: RequestType.RejectTransaction,
    transactionId,
  })
}

export default function TransactionContent(): JSX.Element {
  const [transactionDetails, setTransactionDetails] =
    useState<TransactionWindowDisplay>()

  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (request: TransactionWindowDisplay, _sender) => {
        // TODO: Check sender for safety
        setTransactionDetails(request)
      }
    )
  }, [])

  if (!transactionDetails) {
    return <div>loading...</div>
  }

  return (
    <Flex>
      <Text variant="headlineLarge">{transactionDetails.title}</Text>
      <Text variant="bodyLarge">{transactionDetails.message}</Text>
      <Text variant="bodyLarge">{transactionDetails.transactionId}</Text>
      <Button onPress={(): void => onConfirm(transactionDetails.transactionId)}>
        Confirm
      </Button>
      <Button onPress={(): void => onCancel(transactionDetails.transactionId)}>
        Cancel
      </Button>
    </Flex>
  )
}

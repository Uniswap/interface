import { DappRequestType } from 'app/src/features/dappRequests/dappRequestTypes'
import { useAppDispatch, useAppSelector } from 'app/src/state'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { confirmRequest, rejectRequest } from './saga'
import { DappRequestStoreItem } from './slice'

interface RequestDisplayDetails {
  message: string
  title: string
  request: DappRequestStoreItem
}

export function DappRequestContent(): JSX.Element {
  const pendingRequests = useAppSelector((state) => state.dappRequests.pending)
  const dispatch = useAppDispatch()

  const onConfirm = (requestDisplay: RequestDisplayDetails): void => {
    dispatch(confirmRequest(requestDisplay.request))
  }

  const onCancel = (requestDisplay: RequestDisplayDetails): void => {
    dispatch(rejectRequest(requestDisplay.request))
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return <Text>No approvals pending</Text>
  }

  return (
    <>
      {pendingRequests
        .map(parseRequest)
        .map((requestWithDisplay: RequestDisplayDetails) => {
          return (
            <Flex key={requestWithDisplay.request.dappRequest.requestId}>
              <Text variant="headlineLarge">{requestWithDisplay?.title}</Text>
              <Text variant="bodyLarge">{requestWithDisplay?.message}</Text>
              <Text variant="bodyLarge">
                ID: {requestWithDisplay.request.dappRequest.requestId}
              </Text>
              <Button onPress={(): void => onConfirm(requestWithDisplay)}>
                Confirm
              </Button>
              <Button onPress={(): void => onCancel(requestWithDisplay)}>
                Cancel
              </Button>
            </Flex>
          )
        })}
    </>
  )
}

const parseRequest = (request: DappRequestStoreItem): RequestDisplayDetails => {
  if (request.dappRequest.type === DappRequestType.SendTransaction) {
    return {
      message: 'Confirm this transaction?',
      title: 'Transaction',
      request,
    }
  }
  // TODO: Add other request types here
  return {
    message: 'Confirm this request?',
    title: 'Generic Request',
    request,
  }
}

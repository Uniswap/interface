import { YStack } from 'ui/src'
import {
  Button,
  ButtonEmphasis,
  ButtonSize,
} from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { DappRequestType } from './dappRequestTypes'
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
    const shouldCloseWindow = pendingRequests.length <= 1
    dispatch(confirmRequest(requestDisplay.request))
    if (shouldCloseWindow) {
      window.close()
    }
  }

  const onCancel = (requestDisplay: RequestDisplayDetails): void => {
    const shouldCloseWindow = pendingRequests.length <= 1
    dispatch(rejectRequest(requestDisplay.request))
    if (shouldCloseWindow) {
      window.close()
    }
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return <Text>No approvals pending</Text>
  }

  return (
    <YStack
      alignContent="center"
      justifyContent="center"
      paddingHorizontal="$spacing48"
      paddingTop="$spacing48">
      {pendingRequests
        .map(parseRequest)
        .map((requestWithDisplay: RequestDisplayDetails) => {
          return (
            <Flex
              key={requestWithDisplay.request.dappRequest.requestId}
              gap="$spacing24">
              <Text variant="headlineLarge">{requestWithDisplay?.title}</Text>
              <Text variant="subheadLarge">{requestWithDisplay?.message}</Text>
              <Text variant="bodySmall">
                ID: {requestWithDisplay.request.dappRequest.requestId}
              </Text>
              <YStack gap="$spacing16" marginTop="$spacing16">
                <Button
                  buttonEmphasis={ButtonEmphasis.Primary}
                  buttonSize={ButtonSize.Large}
                  fontSize={18}
                  fontWeight="medium"
                  onPress={(): void => onConfirm(requestWithDisplay)}>
                  Confirm
                </Button>
                <Button
                  buttonEmphasis={ButtonEmphasis.Secondary}
                  buttonSize={ButtonSize.Large}
                  fontSize={18}
                  fontWeight="medium"
                  onPress={(): void => onCancel(requestWithDisplay)}>
                  Cancel
                </Button>
              </YStack>
            </Flex>
          )
        })}
    </YStack>
  )
}

const parseRequest = (request: DappRequestStoreItem): RequestDisplayDetails => {
  switch (request.dappRequest.type) {
    case DappRequestType.SignMessage:
      return {
        message: 'Sign this message?',
        title: 'Sign Message',
        request,
      }
    case DappRequestType.SignTypedData:
      return {
        message: 'Sign this data?',
        title: 'Sign Data',
        request,
      }
    case DappRequestType.SendTransaction:
      return {
        message: 'Confirm this transaction?',
        title: 'Transaction',
        request,
      }
    case DappRequestType.GetAccount:
      return {
        message: 'Confirm this connection request?',
        title: 'Connection Request',
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

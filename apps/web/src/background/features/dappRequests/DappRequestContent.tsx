import { useAppDispatch, useAppSelector } from 'src/background/store'
import { XStack, YStack } from 'ui/src'
import { Button, ButtonSize } from 'ui/src/components/button/Button'
import { Text } from 'ui/src/components/text/Text'
import { ChainId } from 'wallet/src/constants/chains'
import { useAccounts, useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { DappRequestType } from './dappRequestTypes'
import { SendTransactionDetails } from './requestContent/SendTransactionContent'
import { SignMessageDetails } from './requestContent/SignMessageContent'
import { SignTypedDataDetails } from './requestContent/SignTypedDataContent'
import { confirmRequest, rejectRequest } from './saga'
import { DappRequestStoreItem } from './slice'

export interface RequestDisplayDetails {
  message: string
  title: string
  request: DappRequestStoreItem
}

export function DappRequestContent(): JSX.Element {
  // Show only the last request
  const pendingRequests = useAppSelector((state) => state.dappRequests.pending)
  const lastRequest = pendingRequests[pendingRequests.length - 1]
  const requestWithDisplay = parseRequest(lastRequest)

  const accounts = useAccounts()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const activeAccount = accounts[activeAccountAddress]
  if (!activeAccount) {
    throw new Error('No active account')
  }
  // TODO: get active chain id
  const activeChainId = ChainId.Mainnet

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

  let displayDetails = null
  switch (requestWithDisplay.request.dappRequest.type) {
    case DappRequestType.SignMessage:
      displayDetails = (
        <SignMessageDetails activeAccount={activeAccount} request={requestWithDisplay} />
      )
      break
    case DappRequestType.SignTypedData:
      displayDetails = (
        <SignTypedDataDetails
          activeAccount={activeAccount}
          chainId={activeChainId}
          request={requestWithDisplay}
        />
      )
      break
    case DappRequestType.SendTransaction:
      displayDetails = (
        <SendTransactionDetails activeAccount={activeAccount} request={requestWithDisplay} />
      )
      break
  }

  return (
    <YStack
      key={requestWithDisplay.request.dappRequest.requestId}
      alignItems="stretch"
      backgroundColor="$background"
      flex={1}
      gap="$spacing12"
      justifyContent="center"
      padding="$spacing24"
      width="100%">
      <Text textAlign="center" variant="headlineSmall">
        {requestWithDisplay.title}
      </Text>
      <YStack alignItems="stretch" flexShrink={1} width="100%">
        {displayDetails ? (
          displayDetails
        ) : (
          <YStack gap="$spacing12">
            <Text variant="subheadLarge">{requestWithDisplay?.message}</Text>
            <Text variant="bodySmall">ID: {requestWithDisplay.request.dappRequest.requestId}</Text>
          </YStack>
        )}
      </YStack>
      <XStack gap="$spacing12">
        <Button
          buttonSize={ButtonSize.Medium}
          flex={1}
          theme="secondary"
          onPress={(): void => onCancel(requestWithDisplay)}>
          Cancel
        </Button>
        <Button
          buttonSize={ButtonSize.Medium}
          flex={1}
          theme="primary"
          onPress={(): void => onConfirm(requestWithDisplay)}>
          Approve
        </Button>
      </XStack>
    </YStack>
  )
}

const parseRequest = (request?: DappRequestStoreItem): RequestDisplayDetails => {
  if (!request) {
    throw new Error('No request to parse')
  }
  switch (request.dappRequest.type) {
    case DappRequestType.SignMessage:
      return {
        message: 'Sign this message?',
        title: 'Sign Message Request',
        request,
      }
    case DappRequestType.SignTypedData:
      return {
        message: 'Sign this data?',
        title: 'Sign TypedData Request',
        request,
      }
    case DappRequestType.SendTransaction:
      return {
        message: 'Confirm this transaction?',
        title: 'Transaction Request',
        request,
      }
    case DappRequestType.GetAccount:
      return {
        message: 'Connect to this dApp?',
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

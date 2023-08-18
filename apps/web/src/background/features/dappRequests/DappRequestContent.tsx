import { useDappContext } from 'src/background/features/dapp/hooks'
import { selectChainByDappAndWallet } from 'src/background/features/dapp/selectors'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Image } from 'tamagui'
import { Button, Text, XStack, YStack } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { DappRequestType } from './dappRequestTypes'
import { SendTransactionDetails } from './requestContent/SendTransactionContent'
import { SignMessageDetails } from './requestContent/SignMessageContent'
import { SignTypedDataDetails } from './requestContent/SignTypedDataContent'
import { confirmRequest, rejectRequest } from './saga'
import { DappRequestStoreItem } from './slice'

export function DappRequestContent(): JSX.Element {
  const dispatch = useAppDispatch()
  // Show only the last request
  const pendingRequests = useAppSelector((state) => state.dappRequests.pending)
  const request = pendingRequests[pendingRequests.length - 1]

  const { dappName, dappUrl, dappIconUrl } = useDappContext(request?.senderTabId)

  const activeAccount = useActiveAccountWithThrow()
  const activeChainId = useAppSelector(selectChainByDappAndWallet(dappUrl, activeAccount.address))

  if (!activeAccount) {
    throw new Error('No active account')
  }

  const onConfirm = async (requestToConfirm: DappRequestStoreItem): Promise<void> => {
    const shouldCloseWindow = pendingRequests.length <= 1
    await dispatch(confirmRequest(requestToConfirm))
    if (shouldCloseWindow) {
      window.close()
    }
  }

  const onCancel = async (requestToCancel: DappRequestStoreItem): Promise<void> => {
    const shouldCloseWindow = pendingRequests.length <= 1
    await dispatch(rejectRequest(requestToCancel))
    if (shouldCloseWindow) {
      window.close()
    }
  }

  if (!request) {
    return <Text>No approvals pending</Text>
  }

  let displayDetails = null
  switch (request.dappRequest.type) {
    case DappRequestType.SignMessage:
      displayDetails = <SignMessageDetails activeAccount={activeAccount} request={request} />
      break
    case DappRequestType.SignTypedData:
      displayDetails = (
        <SignTypedDataDetails
          activeAccount={activeAccount}
          chainId={activeChainId}
          request={request}
        />
      )
      break
    case DappRequestType.SendTransaction:
      displayDetails = (
        <SendTransactionDetails activeAccount={activeAccount} dappUrl={dappUrl} request={request} />
      )
      break
  }
  let title = 'Confirm?'
  switch (request?.dappRequest.type) {
    case DappRequestType.SignMessage:
      title = `Signature request from ${dappName}?`
      break
    case DappRequestType.SignTypedData:
      title = `Signature request from ${dappName}`
      break
    case DappRequestType.SendTransaction:
      title = `Approve transaction from ${dappName}`
      break
    case DappRequestType.GetAccount:
      title = `Connect to ${dappName}?`
      break
  }

  return (
    <YStack
      key={request.dappRequest.requestId}
      alignItems="stretch"
      backgroundColor="$background"
      flex={1}
      gap="$spacing12"
      justifyContent="center"
      padding="$spacing24"
      width="100%">
      <Image
        alignSelf="center"
        height={iconSizes.icon40}
        source={{ uri: dappIconUrl }}
        width={iconSizes.icon40}
      />
      <Text textAlign="center" variant="headlineSmall">
        {title}
      </Text>
      <Text color="$DEP_accentBranded" textAlign="center" variant="bodyMicro">
        {dappUrl}
      </Text>
      <YStack alignItems="stretch" flexShrink={1} width="100%">
        {displayDetails}
      </YStack>
      <XStack gap="$spacing12">
        <Button
          flex={1}
          theme="secondary"
          onPress={async (): Promise<void> => await onCancel(request)}>
          Cancel
        </Button>
        <Button
          flex={1}
          theme="primary"
          onPress={async (): Promise<void> => await onConfirm(request)}>
          Approve
        </Button>
      </XStack>
    </YStack>
  )
}

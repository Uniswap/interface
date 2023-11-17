import { ethErrors } from 'eth-rpc-errors'
import { useDappContext } from 'src/background/features/dapp/hooks'
import { selectDappChainId } from 'src/background/features/dapp/selectors'
import { AddressFooter } from 'src/background/features/dappRequests/requestContent/AddressFooter'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Image } from 'tamagui'
import { Button, Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ChainId } from 'wallet/src/constants/chains'
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

  const { dappName, dappUrl, dappIconUrl } = useDappContext()

  const activeAccount = useActiveAccountWithThrow()
  const activeChainId = useAppSelector(selectDappChainId(dappUrl)) || ChainId.Mainnet

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
    await dispatch(
      rejectRequest({ ...requestToCancel, error: ethErrors.provider.userRejectedRequest() })
    )
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
      displayDetails = <SignMessageDetails request={request} />
      break
    case DappRequestType.SignTypedData:
      displayDetails = <SignTypedDataDetails chainId={activeChainId} request={request} />
      break
    case DappRequestType.SendTransaction:
      displayDetails = <SendTransactionDetails dappUrl={dappUrl} request={request} />
      break
  }
  let title = 'Confirm?'
  let callToAction = 'Approve'

  switch (request?.dappRequest.type) {
    case DappRequestType.SignMessage:
      title = `Signature request from ${dappName}`
      callToAction = 'Sign'
      break
    case DappRequestType.SignTypedData:
      title = `Signature request from ${dappName}`
      callToAction = 'Sign'
      break
    case DappRequestType.SendTransaction:
      title = `Approve transaction from ${dappName}`
      callToAction = 'Approve'
      break
    case DappRequestType.GetAccountRequest:
      title = `Connect to ${dappName}?`
      callToAction = 'Connect'
      break
  }

  return (
    <Flex
      key={request.dappRequest.requestId}
      fill
      alignItems="stretch"
      bg="$surface1"
      gap="$spacing12"
      justifyContent="space-between"
      px="$spacing24"
      py="$spacing12"
      width="100%">
      <Flex gap="$spacing16" pt="$spacing32">
        <Image height={iconSizes.icon40} source={{ uri: dappIconUrl }} width={iconSizes.icon40} />
        <Flex gap="$spacing8">
          <Text textAlign="left" variant="heading3">
            {title}
          </Text>
          <Text color="$accent1" textAlign="left" variant="body2">
            {dappUrl}
          </Text>
        </Flex>
        <Flex shrink alignItems="stretch" width="100%">
          {displayDetails}
        </Flex>
      </Flex>

      <Flex>
        <Flex row borderColor="$surface3" borderWidth={1} mb="$spacing8" width="100%" />
        <Flex gap="$spacing12" pb="$spacing12">
          <AddressFooter account={activeAccount} />
          <Flex row gap="$spacing12">
            <Button
              theme="secondary"
              width="50%"
              onPress={async (): Promise<void> => await onCancel(request)}>
              Cancel
            </Button>
            <Button
              theme="primary"
              width="50%"
              onPress={async (): Promise<void> => await onConfirm(request)}>
              {callToAction}
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

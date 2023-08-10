import { SignMessageRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { AddressFooter } from 'src/background/features/dappRequests/requestContent/AddressFooter'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { Text, YStack } from 'ui/src'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export const SignMessageDetails = ({
  activeAccount,
  request,
}: {
  activeAccount: Account
  request: DappRequestStoreItem
}): JSX.Element => {
  const signMessageRequest = request.dappRequest as SignMessageRequest
  if (!signMessageRequest) {
    throw new Error('No sign message request')
  }

  return (
    <YStack flex={1} gap="$spacing16" width="100%">
      <YStack
        backgroundColor="$scrim"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        flex={1}
        gap="$spacing16"
        margin="$none"
        overflow="scroll"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12">
        <Text color="$neutral2" variant="bodySmall">
          {signMessageRequest.messageHex}
        </Text>
      </YStack>
      <AddressFooter account={activeAccount} />
    </YStack>
  )
}

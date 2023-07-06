import { useDappContext } from 'src/background/features/dapp/hooks'
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
  const { dappName, dappUrl } = useDappContext()

  const signMessageRequest = request.dappRequest as SignMessageRequest
  if (!signMessageRequest) {
    throw new Error('No sign message request')
  }

  return (
    <YStack gap="$spacing16" width="100%">
      <Text textAlign="center" variant="headlineSmall">
        Signature request from {dappName}
      </Text>
      <Text textAlign="center" variant="headlineSmall">
        {dappUrl}
      </Text>
      <YStack>
        <YStack
          backgroundColor="$backgroundScrim"
          borderTopLeftRadius="$rounded16"
          borderTopRightRadius="$rounded16"
          gap="$spacing16"
          margin="$none"
          overflow="scroll"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12">
          <Text color="$textSecondary" variant="bodySmall">
            {signMessageRequest.messageHex}
          </Text>
        </YStack>
        <AddressFooter account={activeAccount} />
      </YStack>
    </YStack>
  )
}

import { RequestDisplayDetails } from 'src/background/features/dappRequests/DappRequestContent'
import { SignMessageRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { Text, XStack, YStack } from 'ui/src'
import { Unicon } from 'ui/src/components/Unicon'
import { Account } from 'wallet/src/features/wallet/types'

export const SignMessageDetails = ({
  activeAccount,
  request,
}: {
  activeAccount: Account
  request: RequestDisplayDetails
}): JSX.Element => {
  const signMessageRequest = request.request.dappRequest as SignMessageRequest
  if (!signMessageRequest) {
    throw new Error('No sign message request')
  }

  return (
    <YStack gap="$spacing16" width="100%">
      <Text textAlign="center" variant="headlineSmall">
        {request.title}
      </Text>
      <YStack>
        <YStack
          backgroundColor="$backgroundScrim"
          borderTopLeftRadius="$rounded16"
          borderTopRightRadius="$rounded16"
          gap="$spacing16"
          margin="$none"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12">
          <Text color="$textSecondary" variant="bodySmall">
            {signMessageRequest.messageHex}
          </Text>
        </YStack>
        <YStack
          backgroundColor="$backgroundScrim"
          borderBottomLeftRadius="$rounded16"
          borderBottomRightRadius="$rounded16"
          width="100%">
          <XStack
            borderTopColor="$background"
            borderTopWidth="$spacing1"
            flex={1}
            justifyContent="space-between"
            paddingHorizontal="$spacing16"
            paddingVertical="$spacing16"
            width="100%">
            <XStack alignItems="center" gap="$spacing8" maxWidth="100%">
              <Unicon address={activeAccount.address} />
              <Text textOverflow="ellipsis" variant="subheadSmall">
                {activeAccount.name === undefined ? 'Wallet' : activeAccount.name}
              </Text>
            </XStack>
            <Text
              color="$textSecondary"
              overflow="hidden"
              textAlign="right"
              textOverflow="ellipsis"
              variant="bodySmall">
              {/* TODO: Use util to format address */}
              {activeAccount.address.substring(0, 4)}...
              {activeAccount.address.substring(
                activeAccount.address.length - 4,
                activeAccount.address.length
              )}
            </Text>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}

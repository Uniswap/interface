import { RequestDisplayDetails } from 'src/background/features/dappRequests/DappRequestContent'
import { SendTransactionRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { Text, XStack, YStack } from 'ui/src'
import { Unicon } from 'ui/src/components/Unicon'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export const SendTransactionDetails = ({
  activeAccount,
  request,
}: {
  activeAccount: Account
  request: RequestDisplayDetails
}): JSX.Element => {
  const sendTransactionRequest = request.request.dappRequest as SendTransactionRequest
  const sending = sendTransactionRequest.transaction.value

  const toAddress = sendTransactionRequest.transaction.to
  const networkFee = '$123.45' // TODO: Update with real network fee
  const contractFunction = sendTransactionRequest.transaction.type
  return (
    <YStack>
      <YStack
        backgroundColor="$backgroundScrim"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        margin="$none"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12">
        <XStack justifyContent="space-between">
          <Text color="$textSecondary" variant="bodySmall">
            Sending
          </Text>
          <XStack gap="$spacing4">
            <Text textAlign="right" variant="subheadSmall">
              {sending}
            </Text>
          </XStack>
        </XStack>

        <XStack justifyContent="space-between">
          <Text color="$textSecondary" variant="bodySmall">
            To
          </Text>
          <XStack gap="$spacing4">
            <Text textAlign="right" variant="bodySmall">
              {toAddress?.substring(0, 10)}...
            </Text>
          </XStack>
        </XStack>
        {contractFunction ? (
          <XStack justifyContent="space-between">
            <Text color="$textSecondary" variant="bodySmall">
              Function
            </Text>
            <XStack gap="$spacing4">
              <Text textAlign="right" variant="bodySmall">
                {contractFunction}
              </Text>
            </XStack>
          </XStack>
        ) : null}
      </YStack>
      <YStack
        backgroundColor="$backgroundScrim"
        borderBottomLeftRadius="$rounded16"
        borderBottomRightRadius="$rounded16">
        <XStack
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          width="100%">
          <Text variant="subheadSmall">Network fee</Text>
          <Text color="$textSecondary" textAlign="right" variant="bodySmall">
            {networkFee}
          </Text>
        </XStack>

        <XStack
          alignItems="center"
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing16">
          <XStack alignItems="center" gap="$spacing8">
            <Unicon address={activeAccount.address} />
            <Text variant="subheadSmall">{activeAccount.name ?? 'Wallet'}</Text>
          </XStack>
          <Text color="$textSecondary" textAlign="right" variant="bodySmall">
            {/* TODO: Use util to format address */}
            {activeAccount.address.substring(0, 8)}...
          </Text>
        </XStack>
      </YStack>
    </YStack>
  )
}

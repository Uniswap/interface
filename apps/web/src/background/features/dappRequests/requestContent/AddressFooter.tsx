import { Text, Unicon, XStack, YStack } from 'ui/src'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

export function AddressFooter({ account }: { account: Account }): JSX.Element {
  return (
    <YStack borderBottomLeftRadius="$rounded16" borderBottomRightRadius="$rounded16" width="100%">
      <XStack
        borderTopColor="$background"
        borderTopWidth="$spacing1"
        flex={1}
        justifyContent="space-between"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing16"
        width="100%">
        <XStack alignItems="center" gap="$spacing8" maxWidth="100%">
          <Unicon address={account.address} />
          <Text textOverflow="ellipsis" variant="subheadSmall">
            {account.name === undefined ? 'Wallet' : account.name}
          </Text>
        </XStack>
        <Text
          color="$neutral2"
          overflow="hidden"
          textAlign="right"
          textOverflow="ellipsis"
          variant="bodySmall">
          {sanitizeAddressText(shortenAddress(account.address))}
        </Text>
      </XStack>
    </YStack>
  )
}

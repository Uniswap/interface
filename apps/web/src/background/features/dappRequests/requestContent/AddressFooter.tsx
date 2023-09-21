import { Flex, Text, Unicon } from 'ui/src'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

export function AddressFooter({ account }: { account: Account }): JSX.Element {
  return (
    <Flex borderBottomLeftRadius="$rounded16" borderBottomRightRadius="$rounded16" width="100%">
      <Flex
        fill
        row
        borderTopColor="$background"
        borderTopWidth="$spacing1"
        justifyContent="space-between"
        px="$spacing16"
        py="$spacing16"
        width="100%">
        <Flex row alignItems="center" gap="$spacing8" maxWidth="100%">
          <Unicon address={account.address} />
          <Text textOverflow="ellipsis" variant="subheading2">
            {account.name === undefined ? 'Wallet' : account.name}
          </Text>
        </Flex>
        <Text
          color="$neutral2"
          overflow="hidden"
          textAlign="right"
          textOverflow="ellipsis"
          variant="body2">
          {sanitizeAddressText(shortenAddress(account.address))}
        </Text>
      </Flex>
    </Flex>
  )
}

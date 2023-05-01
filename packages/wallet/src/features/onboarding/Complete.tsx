import { Stack } from 'tamagui'
import { Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { iconSize } from 'ui/src/theme/tokens'
import { Unicon } from 'wallet/src/components/Unicon'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

export function Complete(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()

  if (!address) {
    throw new Error('No address found')
  }

  return (
    <Stack alignItems="center">
      <Unicon address={address} size={iconSize.icon64} />
      {/* TODO: add wallet name */}
      <Text variant="subheadSmall">
        {sanitizeAddressText(shortenAddress(address))}
      </Text>
      <Button onPress={(): void => window.close()}>Close</Button>
    </Stack>
  )
}

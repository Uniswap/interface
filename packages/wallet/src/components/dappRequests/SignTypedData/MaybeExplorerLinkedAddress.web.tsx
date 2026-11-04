import { Text } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { shortenAddress } from 'utilities/src/addresses'
import type { MaybeExplorerLinkedAddressProps } from 'wallet/src/components/dappRequests/SignTypedData/MaybeExplorerLinkedAddress'

export function MaybeExplorerLinkedAddress({ address, link }: MaybeExplorerLinkedAddressProps): JSX.Element {
  if (!link) {
    return (
      <Text color="$neutral1" variant="body4">
        {shortenAddress({ address })}
      </Text>
    )
  }
  return (
    <Text
      tag="a"
      alignItems="center"
      display="flex"
      flexDirection="row"
      gap="$spacing4"
      href={link}
      lineHeight={16}
      rel="noopener noreferrer"
      target="_blank"
      textDecorationLine="none"
    >
      <Text color="$neutral1" variant="body4">
        {shortenAddress({ address })}
      </Text>
      <ExternalLink color="$neutral2" size="$icon.16" />
    </Text>
  )
}

import { Anchor, Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons'
import { shortenAddress } from 'utilities/src/addresses'

interface MaybeExplorerLinkedAddressProps {
  address: string
  link: Maybe<string>
}

export function MaybeExplorerLinkedAddress({ address, link }: MaybeExplorerLinkedAddressProps): JSX.Element {
  if (!link) {
    return (
      <Text color="$neutral1" variant="body4">
        {shortenAddress({ address })}
      </Text>
    )
  }
  return (
    <Anchor
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
    </Anchor>
  )
}

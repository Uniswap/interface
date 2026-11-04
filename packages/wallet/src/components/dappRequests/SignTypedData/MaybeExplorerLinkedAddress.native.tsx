import { Text, TouchableArea } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
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
    // mycelium's compat layer drops tag/href/target/rel on native, so an anchor tap does nothing on mobile — use TouchableArea + openUri instead
    <TouchableArea
      alignItems="center"
      flexDirection="row"
      gap="$spacing4"
      onPress={() => {
        openUri({ uri: link }).catch(() => {
          logger.error(new Error('Failed to open explorer linked address'), {
            tags: { file: 'MaybeExplorerLinkedAddress.native', function: 'onPress' },
            extra: { link },
          })
        })
      }}
    >
      <Text color="$neutral1" variant="body4">
        {shortenAddress({ address })}
      </Text>
      <ExternalLink color="$neutral2" size="$icon.16" />
    </TouchableArea>
  )
}

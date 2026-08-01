import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Flex, Text } from 'ui/src'
import { shortenAddress } from 'utilities/src/addresses'

interface HookTooltipProps {
  hookEntry: HookEntry
}

// Hovering a hook name in the pools table shows the full (untruncated) name and the hook's
// middle-ellipsized address. Richer details (chain, description, flags) live in
// HookDetailsModal, opened by clicking the name.
export function HookTooltip({ hookEntry }: HookTooltipProps) {
  return (
    <Flex gap="$gap4" p="$padding4" maxWidth={300}>
      <Text variant="body3" color="$neutral1">
        {hookEntry.name || shortenAddress({ address: hookEntry.address })}
      </Text>
      <Text variant="body4" color="$neutral2">
        {shortenAddress({ address: hookEntry.address, chars: 9, charsEnd: 6 })}
      </Text>
    </Flex>
  )
}

import { Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'

export interface BridgeProviderLabelProps {
  /** Slot: the vendor's logo, sized `$icon.16`. */
  logo: ReactNode
  /** The vendor's display name, e.g. "Relay API". */
  name: string
}

/** The routing row's label for a bridge served by a vendor other than Across, whose row predates the aggregator. */
export function BridgeProviderLabel({ logo, name }: BridgeProviderLabelProps): JSX.Element {
  return (
    <Flex row shrink justifyContent="flex-end" gap="$spacing6" alignItems="center">
      {logo}
      <Text color="$neutral1" variant="body3">
        {name}
      </Text>
    </Flex>
  )
}

export interface BridgeProviderRoutingCaptionProps {
  caption: string
}

/** Web tooltip body. The native modal shows the same string through the shell's `caption`, adapter side. */
export function BridgeProviderRoutingCaption({ caption }: BridgeProviderRoutingCaptionProps): JSX.Element {
  return (
    <Text variant="body4" color="$neutral2">
      {caption}
    </Text>
  )
}

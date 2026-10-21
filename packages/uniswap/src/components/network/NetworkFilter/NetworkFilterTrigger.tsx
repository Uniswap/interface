import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { iconSizes } from '@universe/mycelium/tokens'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { Tooltip } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'

const NETWORK_ICON_SIZE = iconSizes.icon20
const TOOLTIP_DELAY = { close: 0, open: 0 }
// The chrome must live on the trigger itself: the popover anchors to it, so a frame wrapped around it
// from outside leaves the menu offset from the visible button edges.
const OUTLINED_STYLE = {
  borderRadius: '$rounded12',
  px: '$padding12',
  py: '$padding8',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  hoverStyle: { backgroundColor: '$surface2' },
} as const

interface NetworkFilterTriggerProps {
  displayedChainId: UniverseChainId | null
  isOpen: boolean
  onPress: () => void
  tooltipLabel?: string
  content?: ReactNode
  outlined?: boolean
}

export function NetworkFilterTrigger({
  displayedChainId,
  isOpen,
  onPress,
  tooltipLabel,
  content,
  outlined,
}: NetworkFilterTriggerProps): JSX.Element {
  const networkLogo = <NetworkLogo chainId={displayedChainId} size={NETWORK_ICON_SIZE} />
  const logo = tooltipLabel ? (
    <Tooltip delay={TOOLTIP_DELAY} restMs={0} placement="top">
      <Tooltip.Trigger>{networkLogo}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4">{tooltipLabel}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  ) : (
    networkLogo
  )

  return (
    <TouchableArea
      {...(outlined ? OUTLINED_STYLE : undefined)}
      testID={TestID.TokensNetworkFilterTrigger}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing4">
        {content ?? logo}
        <RotatableChevron
          animation="100ms"
          animateOnly={['transform', 'opacity']}
          color="$neutral2"
          direction={isOpen ? 'up' : 'down'}
          size="$icon.20"
        />
      </Flex>
    </TouchableArea>
  )
}

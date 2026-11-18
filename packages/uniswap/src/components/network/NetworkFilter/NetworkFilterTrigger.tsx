import { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea, Tooltip } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { iconSizes } from '@universe/mycelium/tokens'
import { TestID } from '@universe/test'
import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getChainLabel } from 'uniswap/src/features/chains/utils'

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

// The rest props carry the web popover trigger's ref, handlers and aria attributes onto the TouchableArea.
type NetworkFilterTriggerProps = Omit<ComponentProps<typeof TouchableArea>, 'children' | 'content'> & {
  displayedChainId: UniverseChainId | null
  isOpen: boolean
  tooltipLabel?: string
  content?: ReactNode
  outlined?: boolean
  chevronSize?: 16 | 20
}

export function NetworkFilterTrigger({
  displayedChainId,
  isOpen,
  tooltipLabel,
  content,
  outlined,
  chevronSize = 20,
  'aria-label': ariaLabel,
  ...rest
}: NetworkFilterTriggerProps): JSX.Element {
  const { t } = useTranslation()
  const networkLabel = displayedChainId ? getChainLabel(displayedChainId) : t('transaction.network.all')
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
      // Custom content names the trigger with its own text.
      aria-label={ariaLabel ?? (content === undefined ? networkLabel : undefined)}
      aria-expanded={isOpen}
      {...rest}
    >
      <Flex row alignItems="center" gap="$spacing4">
        {content ?? logo}
        <RotatableChevron
          animation="100ms"
          animateOnly={['transform', 'opacity']}
          color="$neutral2"
          direction={isOpen ? 'up' : 'down'}
          size={chevronSize}
        />
      </Flex>
    </TouchableArea>
  )
}

import { Flex, Text, Tooltip, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const NETWORK_ICON_SIZE = iconSizes.icon20
const TOOLTIP_DELAY = { close: 0, open: 0 }

interface NetworkFilterTriggerProps {
  defaultChainId: UniverseChainId
  includeAllNetworks?: boolean
  isOpen: boolean
  onPress: () => void
  selectedChain: UniverseChainId | null
  tooltipLabel?: string
}

export function NetworkFilterTrigger({
  defaultChainId,
  includeAllNetworks,
  isOpen,
  onPress,
  selectedChain,
  tooltipLabel,
}: NetworkFilterTriggerProps): JSX.Element {
  const displayedChainId = selectedChain ?? (includeAllNetworks ? null : defaultChainId)
  const networkLogo = <NetworkLogo chainId={displayedChainId} size={NETWORK_ICON_SIZE} />

  return (
    <TouchableArea testID={TestID.TokensNetworkFilterTrigger} onPress={onPress}>
      <Flex row alignItems="center" gap="$spacing4">
        {tooltipLabel ? (
          <Tooltip delay={TOOLTIP_DELAY} restMs={0} placement="top">
            <Tooltip.Trigger>{networkLogo}</Tooltip.Trigger>
            <Tooltip.Content>
              <Text variant="body4">{tooltipLabel}</Text>
              <Tooltip.Arrow />
            </Tooltip.Content>
          </Tooltip>
        ) : (
          networkLogo
        )}
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

import { ReactNode } from 'react'
import { Flex, Text, Tooltip, TouchableArea } from 'ui/src'

type TokenGridTileProps = {
  icon: ReactNode
  label: Maybe<string>
  testID: string
  onPress: () => void
  tooltipLabel?: Maybe<string>
  labelNumberOfLines?: number
}

/** Presentational tile shared by the token-selector grids (suggested currencies and stocks). */
export function TokenGridTile({
  icon,
  label,
  testID,
  onPress,
  tooltipLabel,
  labelNumberOfLines,
}: TokenGridTileProps): JSX.Element {
  const card = (
    <TouchableArea hoverable borderRadius="$rounded16" testID={testID} onPress={onPress}>
      <Flex
        centered
        gap="$gap4"
        backgroundColor="$surface2"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        borderRadius="$rounded16"
        px="$spacing8"
        py="$spacing12"
      >
        {icon}
        <Text color="$neutral1" variant="buttonLabel3" numberOfLines={labelNumberOfLines}>
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )

  if (!tooltipLabel) {
    return card
  }

  return (
    <Tooltip placement="bottom" offset={{ mainAxis: 4 }} delay={{ close: 0, open: 750 }}>
      <Tooltip.Trigger>{card}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text color="$neutral1" variant="body3">
          {tooltipLabel}
        </Text>
      </Tooltip.Content>
    </Tooltip>
  )
}

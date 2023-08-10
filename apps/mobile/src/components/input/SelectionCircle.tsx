import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Theme, theme } from 'ui/src/theme/restyle/theme'

interface SelectionCircleProps {
  selected: boolean
  size: keyof Theme['iconSizes']
  unselectedColor?: keyof Theme['colors']
  selectedColor?: keyof Theme['colors']
}

export function SelectionCircle({
  selected,
  size,
  unselectedColor = 'neutral2',
  selectedColor = 'accent1',
}: SelectionCircleProps): JSX.Element {
  return (
    <Flex
      centered
      borderColor={selected ? selectedColor : unselectedColor}
      borderRadius="roundedFull"
      borderWidth={1}
      height={theme.iconSizes[size]}
      width={theme.iconSizes[size]}>
      <Box
        backgroundColor={selected ? selectedColor : unselectedColor}
        borderRadius="roundedFull"
        height={theme.iconSizes[size] / 2}
        opacity={selected ? 1 : 0}
        width={theme.iconSizes[size] / 2}
      />
    </Flex>
  )
}

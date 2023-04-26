import React from 'react'
import { Box, Flex } from 'src/components/layout'
import { Theme, theme } from 'src/styles/theme'

interface SelectionCircleProps {
  selected: boolean
  size: keyof Theme['iconSizes']
  unselectedColor?: keyof Theme['colors']
  selectedColor?: keyof Theme['colors']
}

export function SelectionCircle({
  selected,
  size,
  unselectedColor = 'textSecondary',
  selectedColor = 'magentaVibrant',
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

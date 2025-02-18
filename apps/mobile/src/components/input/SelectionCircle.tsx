import React from 'react'
import { ColorTokens, Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

interface SelectionCircleProps {
  selected: boolean
  size: keyof typeof iconSizes
  unselectedColor?: ColorTokens
  selectedColor?: ColorTokens
}

export function SelectionCircle({
  selected,
  size,
  unselectedColor = '$neutral2',
  selectedColor = '$accent1',
}: SelectionCircleProps): JSX.Element {
  return (
    <Flex
      centered
      borderColor={selected ? selectedColor : unselectedColor}
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      height={iconSizes[size]}
      width={iconSizes[size]}
    >
      <Flex
        backgroundColor={selected ? selectedColor : unselectedColor}
        borderRadius="$roundedFull"
        height={iconSizes[size] / 2}
        opacity={selected ? 1 : 0}
        width={iconSizes[size] / 2}
      />
    </Flex>
  )
}

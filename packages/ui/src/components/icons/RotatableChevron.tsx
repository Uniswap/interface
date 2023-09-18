import { memo } from 'react'
import { ColorTokens, Flex, FlexProps, Icons } from 'ui/src'

type Props = {
  width?: string | number
  height?: string | number
  direction?: 'n' | 'e' | 's' | 'w'
  color?: ColorTokens
} & Omit<FlexProps, 'direction'>

function _RotatableChevron({
  color,
  width = 24,
  height = 24,
  direction = 'w',
  ...rest
}: Props): JSX.Element {
  let degree: string
  switch (direction) {
    case 'n':
      degree = '90deg'
      break
    case 'e':
      degree = '180deg'
      break
    case 's':
      degree = '270deg'
      break
    case 'w':
    default:
      degree = '0deg'
      break
  }

  return (
    <Flex
      centered
      borderRadius="$roundedFull"
      gap="$none"
      style={{ transform: [{ rotate: degree }] }}
      {...rest}>
      <Icons.Chevron color={color} height={height} width={width} />
    </Flex>
  )
}

export const RotatableChevron = memo(_RotatableChevron)

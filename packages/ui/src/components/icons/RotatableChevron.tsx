import { memo } from 'react'
import { I18nManager } from 'react-native'
import { ColorTokens } from 'tamagui'
import * as Icons from 'ui/src/components/icons/allIcons'
import { Flex, FlexProps } from 'ui/src/components/layout'

type Props = {
  width?: string | number
  height?: string | number
  direction?: 'up' | 'right' | 'down' | 'left' | 'start' | 'end'
  color?: ColorTokens
} & Omit<FlexProps, 'direction'>

function _RotatableChevron({
  color,
  width = 24,
  height = 24,
  direction = 'start',
  ...rest
}: Props): JSX.Element {
  let degree: string
  switch (direction) {
    case 'start':
      degree = I18nManager.isRTL ? '180deg' : '0deg'
      break
    case 'end':
      degree = I18nManager.isRTL ? '0deg' : '180deg'
      break
    case 'up':
      degree = '90deg'
      break
    case 'right':
      degree = '180deg'
      break
    case 'down':
      degree = '270deg'
      break
    case 'left':
    default:
      degree = '0deg'
      break
  }

  return (
    <Flex
      centered
      borderRadius="$roundedFull"
      style={{ transform: [{ rotate: degree }] }}
      {...rest}>
      {/* @ts-expect-error TODO(MOB-1570) this works but we should migrate to size prop */}
      <Icons.Chevron color={color} height={height} width={width} />
    </Flex>
  )
}

export const RotatableChevron = memo(_RotatableChevron)

import { memo, useMemo } from 'react'
import { I18nManager } from 'react-native'
import { ColorTokens } from 'tamagui'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { Chevron } from 'ui/src/components/icons'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { IconSizeTokens } from 'ui/src/theme/tokens'

type Props = {
  size?: IconSizeTokens
  direction?: 'up' | 'right' | 'down' | 'left' | 'start' | 'end'
  color?: ColorTokens
} & Omit<FlexProps, 'direction' | '$group-item-hover' | 'width' | 'height'> &
  Pick<IconProps, '$group-item-hover'>

function _RotatableChevron({
  color,
  size = '$icon.24',
  direction = 'start',
  animation = 'fast',
  '$group-item-hover': $groupItemHover,
  ...rest
}: Props): JSX.Element {
  const degree = useMemo(() => {
    switch (direction) {
      case 'start':
        return I18nManager.isRTL ? '180deg' : '0deg'
      case 'end':
        return I18nManager.isRTL ? '0deg' : '180deg'
      case 'up':
        return '90deg'
      case 'right':
        return '180deg'
      case 'down':
        return '270deg'
      case 'left':
      default:
        return '0deg'
    }
  }, [direction])

  return (
    <Flex centered borderRadius="$roundedFull" rotate={degree} animation={animation} {...rest}>
      <Chevron $group-item-hover={$groupItemHover} color={color} size={size} />
    </Flex>
  )
}
export const RotatableChevron = memo(_RotatableChevron)

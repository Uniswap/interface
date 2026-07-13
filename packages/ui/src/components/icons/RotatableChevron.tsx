import { memo, useMemo } from 'react'
import { I18nManager } from 'react-native'
import { ColorTokens } from 'tamagui'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { Chevron } from 'ui/src/components/icons'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { DynamicColor, useSporeColors, UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { getIsValidSporeColor, IconSizeTokens } from 'ui/src/theme/tokens'

type Props = {
  size?: IconSizeTokens
  direction?: 'up' | 'right' | 'down' | 'left' | 'start' | 'end'
  color?: ColorTokens
} & Omit<FlexProps, 'direction' | '$group-item-hover' | 'width' | 'height'> &
  Pick<IconProps, '$group-item-hover'>

function RotatableChevronIcon({
  color,
  size = '$icon.24',
  direction = 'start',
  animation = 'fast',
  '$group-item-hover': $groupItemHover,
  ...rest
}: Props): JSX.Element {
  const colors = useSporeColors()

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

  // Resolve $token color strings to CSS variable references (e.g. var(--neutral2)) so that
  // the icon factory's resolveValues:'value' doesn't bake them to static computed values at
  // mount. The browser re-resolves var(--token) on every paint, so the color tracks theme changes.
  const resolvedColor = useMemo((): DynamicColor | undefined => {
    if (typeof color !== 'string' || !getIsValidSporeColor(color)) {
      return color
    }
    const key = color.slice(1) as keyof UseSporeColorsReturn
    // oxlint-disable-next-line typescript/no-unnecessary-condition
    return colors[key]?.get() ?? color
  }, [color, colors])

  return (
    <Flex centered borderRadius="$roundedFull" rotate={degree} animation={animation} {...rest}>
      <Chevron $group-item-hover={$groupItemHover} color={resolvedColor as ColorTokens} size={size} />
    </Flex>
  )
}
export const RotatableChevron = memo(RotatableChevronIcon)

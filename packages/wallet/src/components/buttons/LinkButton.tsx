import { useMemo } from 'react'
import { Flex, FlexProps, Text, TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons'
import { iconSizes, TextVariantTokens } from 'ui/src/theme'
import { openUri } from 'uniswap/src/utils/linking'

interface LinkButtonProps extends Omit<TouchableAreaProps, 'onPress' | 'children' | 'variant'> {
  label: string
  url: string
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  color?: string
  iconColor?: string
  showIcon?: boolean
  size?: number
  textVariant?: TextVariantTokens
}

export function LinkButton({
  url,
  label,
  textVariant,
  color,
  iconColor,
  showIcon = true,
  openExternalBrowser = false,
  isSafeUri = false,
  size = iconSizes.icon20,
  justifyContent = 'center',
  ...rest
}: LinkButtonProps & Pick<FlexProps, 'justifyContent'>): JSX.Element {
  const colors = useSporeColors()
  const colorStyles = useMemo(() => {
    return color
      ? { style: { color } }
      : // if a hex color is not defined, don't give the Text component a style prop, because that will override its default behavior of using neutral1 when no color prop is defined
        {}
  }, [color])

  return (
    <TouchableArea onPress={() => openUri({ uri: url, openExternalBrowser, isSafeUri })} {...rest}>
      <Flex row alignItems="center" gap="$spacing4" justifyContent={justifyContent}>
        <Text {...colorStyles} flexShrink={1} variant={textVariant}>
          {label}
        </Text>
        {showIcon && <ExternalLink color={iconColor ?? color ?? colors.accent1.get()} size={size} strokeWidth={1.5} />}
      </Flex>
    </TouchableArea>
  )
}

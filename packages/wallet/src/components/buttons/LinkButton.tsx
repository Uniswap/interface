import { Flex, FlexCompatProps, iconSizes, Text, TouchableArea, TouchableAreaCompatProps } from '@universe/mycelium'
import { ExternalLink } from '@universe/mycelium/icons/ExternalLink'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { TextVariantTokens } from 'ui/src/theme'
import { openUri } from 'uniswap/src/utils/linking'

interface LinkButtonProps extends Omit<TouchableAreaCompatProps, 'onPress' | 'children' | 'variant'> {
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
  // Defaults to shrinkable so a long label (e.g. a dapp hostname) can be constrained to
  // the available row width and wrap onto multiple lines, instead of overflowing its row
  // and getting clipped by an ancestor's overflow — no part of the label is ever hidden.
  // Callers that need a fixed-width, non-shrinking link can opt out via the `flexShrink` prop.
  flexShrink = 1,
  ...rest
}: LinkButtonProps & Pick<FlexCompatProps, 'justifyContent'>): JSX.Element {
  const colors = useSporeColors()
  const colorStyles = useMemo(() => {
    return color
      ? { style: { color } }
      : // if a hex color is not defined, don't give the Text component a style prop, because that will override its default behavior of using neutral1 when no color prop is defined
        {}
  }, [color])

  return (
    <TouchableArea
      flexShrink={flexShrink}
      onPress={() => openUri({ uri: url, openExternalBrowser, isSafeUri })}
      {...rest}
    >
      <Flex row alignItems="center" gap="$spacing4" justifyContent={justifyContent} flexShrink={1}>
        <Text {...colorStyles} flexShrink={1} variant={textVariant ?? 'body2'}>
          {label}
        </Text>
        {showIcon && <ExternalLink color={iconColor ?? color ?? colors.accent1.get()} size={size} strokeWidth={1.5} />}
      </Flex>
    </TouchableArea>
  )
}

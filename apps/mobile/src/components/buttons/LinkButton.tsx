import React, { useMemo } from 'react'
import { Flex, FlexProps, Text, TouchableArea, TouchableAreaProps, useSporeColors } from 'ui/src'
import ExternalLinkIcon from 'ui/src/assets/icons/external-link.svg'
import { TextVariantTokens, iconSizes } from 'ui/src/theme'
import { openUri } from 'wallet/src/utils/linking'

interface LinkButtonProps extends Omit<TouchableAreaProps, 'onPress'> {
  label: string
  url: string
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  color?: string
  iconColor?: string
  size?: number
  textVariant?: TextVariantTokens
}

export function LinkButton({
  url,
  label,
  textVariant,
  color,
  iconColor,
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
    <TouchableArea
      onPress={(): Promise<void> => openUri(url, openExternalBrowser, isSafeUri)}
      {...rest}>
      <Flex row alignItems="center" gap="$spacing4" justifyContent={justifyContent}>
        <Text {...colorStyles} variant={textVariant}>
          {label}
        </Text>
        <ExternalLinkIcon
          color={iconColor ?? color ?? colors.accent1.get()}
          height={size}
          strokeWidth={1.5}
          width={size}
        />
      </Flex>
    </TouchableArea>
  )
}

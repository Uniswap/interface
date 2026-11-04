import {
  Flex,
  type FlexProps,
  type SpaceTokens,
  Text,
  getTokenValue,
  fonts,
  type IconSizeTokens,
  type TextVariantKey,
} from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
type GenericHeaderProps = {
  Icon?: GeneratedIcon
  /* Size of the icon itself.*/
  iconSize?: IconSizeTokens
  /* The icon padding is relative to the icon size. If a value is provided, it will override the default padding. */
  iconPaddingOverride?: SpaceTokens
  title?: string
  titleVariant?: TextVariantKey
  subtitle?: string
  subtitleVariant?: TextVariantKey
  flexProps?: FlexProps
}

/**
 * Helper component to render an icon w/ padding, title, and subtitle
 */
export function GenericHeader({
  title,
  titleVariant = 'subheading1',
  subtitle,
  subtitleVariant = 'subheading2',
  Icon,
  iconSize = '$icon.18',
  iconPaddingOverride,
  flexProps,
}: GenericHeaderProps): JSX.Element {
  const media = useMedia()
  const showIcon = !media.short

  const iconTotalSizeValue = getTokenValue(iconSize)
  const iconPadding = iconPaddingOverride ?? iconTotalSizeValue / 2

  return (
    <Flex centered gap="$spacing8" {...flexProps}>
      {showIcon && Icon && (
        <Flex centered mb="$spacing4">
          <Flex centered backgroundColor="$surface3" borderRadius="$rounded8" p={iconPadding}>
            <Icon color="$neutral1" size={iconSize} />
          </Flex>
        </Flex>
      )}
      {title && (
        <Text textAlign="center" variant={titleVariant}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          $short={{ variant: 'body3' }}
          color="$neutral2"
          maxFontSizeMultiplier={media.short ? 1.1 : fonts.body2.maxFontSizeMultiplier}
          textAlign="center"
          variant={subtitleVariant}
        >
          {subtitle}
        </Text>
      )}
    </Flex>
  )
}

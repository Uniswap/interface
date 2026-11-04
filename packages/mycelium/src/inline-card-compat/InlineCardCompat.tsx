import type { JSX } from 'react'
import type { GeneratedIcon, IconProps } from '../components/factories/createIcon'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../flex-compat/props'
import type { TextCompatProps } from '../text-compat/props'
import { TextCompat } from '../text-compat/TextCompat'
import { TouchableAreaCompat } from '../touchable-area/TouchableAreaCompat'

/**
 * Legacy InlineCard surface with each color slot typed off the compat prop it lands on:
 * the compat color maps throw at render on unknown tokens, so the narrower types fail at typecheck instead.
 */
type InlineCardProps = {
  Icon: GeneratedIcon | ((props: IconProps) => JSX.Element)
  iconColor?: IconProps['color']
  iconProps?: FlexCompatProps
  iconSize?: IconProps['size']
  /**
   * Lands on BOTH the heading Text and, when `iconColor` is absent, the icon
   * — so it must satisfy both slots' unions. The intersection keeps a
   * text-only token from reaching the icon resolver (which throws on tokens
   * outside its map) without a cast.
   */
  color: TextCompatProps['color'] & IconProps['color']
  backgroundColor?: FlexCompatProps['backgroundColor']
  padding?: FlexCompatProps['p']
  description: string | JSX.Element
  iconBackgroundColor?: FlexCompatProps['backgroundColor']
  heading?: string | JSX.Element
  CtaButtonIcon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
  CtaButtonIconColor?: IconProps['color']
  onPressCtaButton?: () => void
}

/**
 * Drop-in for the legacy `InlineCard`: a Flex/Text/Icon composition on the
 * compat primitives — cross-platform without its own leg split (the
 * ProgressCompat precedent).
 */
export function InlineCardCompat({
  Icon,
  iconColor,
  iconProps,
  iconSize = '$icon.20',
  color,
  backgroundColor = '$surface2',
  iconBackgroundColor,
  padding = '$spacing12',
  heading,
  description,
  CtaButtonIcon,
  CtaButtonIconColor = '$neutral3',
  onPressCtaButton,
}: InlineCardProps): JSX.Element {
  const icon = <Icon color={iconColor ?? color} size={iconSize} />
  const iconElement = iconBackgroundColor ? (
    <FlexCompat backgroundColor={iconBackgroundColor} borderRadius="$rounded12" p="$spacing8">
      {icon}
    </FlexCompat>
  ) : (
    icon
  )

  const descriptionElement =
    typeof description === 'string' ? (
      <TextCompat color="$neutral2" variant="body3">
        {description}
      </TextCompat>
    ) : (
      description
    )

  const headingElement =
    typeof heading === 'string' ? (
      <TextCompat color={color} variant="body3">
        {heading}
      </TextCompat>
    ) : (
      heading
    )

  return (
    <FlexCompat row backgroundColor={backgroundColor} borderRadius="$rounded16" gap="$spacing12" p={padding}>
      <FlexCompat {...iconProps}>{iconElement}</FlexCompat>
      <FlexCompat fill grow row gap="$spacing4" justifyContent="space-between">
        <FlexCompat fill grow gap="$spacing2">
          {headingElement}
          {descriptionElement}
        </FlexCompat>
        {CtaButtonIcon && (
          <TouchableAreaCompat onPress={onPressCtaButton}>
            <CtaButtonIcon color={CtaButtonIconColor} size={iconSize} />
          </TouchableAreaCompat>
        )}
      </FlexCompat>
    </FlexCompat>
  )
}

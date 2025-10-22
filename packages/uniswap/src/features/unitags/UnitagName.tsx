import { Flex, FlexProps, Text, TextProps } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { fonts, spacing } from 'ui/src/theme'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

export function UnitagName({
  name,
  opacity = 1,
  animateText = false,
  animateIcon = false,
  displayIconInline = false,
  displayUnitagSuffix,
  textProps,
}: {
  name?: string
  opacity?: number
  animateText?: boolean
  animateIcon?: boolean
  displayIconInline?: boolean
  displayUnitagSuffix?: boolean
  textProps?: TextProps
}): JSX.Element {
  const iconContainerProps: FlexProps = displayIconInline
    ? {}
    : {
        position: 'absolute',
        right: -spacing.spacing24,
        top: -spacing.spacing4,
      }

  return (
    <Flex
      row
      alignSelf="center"
      animation="lazy"
      enterStyle={animateText ? { opacity: 0 } : undefined}
      exitStyle={animateText ? { opacity: 0 } : undefined}
      opacity={opacity}
      alignItems="center"
      testID={`${name}${UNITAG_SUFFIX}`}
    >
      <Text
        color="$neutral1"
        fontFamily="$heading"
        fontWeight={fonts.heading2.fontWeight}
        lineHeight={fonts.heading2.lineHeight}
        {...textProps}
      >
        {name}
      </Text>
      {displayUnitagSuffix && (
        <Text
          color="$neutral2"
          fontFamily="$heading"
          fontWeight={fonts.heading2.fontWeight}
          lineHeight={fonts.heading2.lineHeight}
          {...textProps}
        >
          {UNITAG_SUFFIX}
        </Text>
      )}
      <Flex
        {...iconContainerProps}
        row
        animation="lazy"
        ml="$spacing4"
        enterStyle={animateIcon ? { opacity: 0, scale: 0.8, x: 20 } : undefined}
        exitStyle={animateIcon ? { opacity: 0, scale: 0.8, x: -20 } : undefined}
      >
        <Unitag size="$icon.24" />
      </Flex>
    </Flex>
  )
}

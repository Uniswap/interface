import { Flex, FlexProps, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'

export function UnitagName({
  name,
  fontSize,
  opacity = 1,
  animateIcon = false,
  displayIconInline = false,
}: {
  name?: string
  fontSize: number
  opacity?: number
  animateIcon?: boolean
  displayIconInline?: boolean
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
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      opacity={opacity}
      alignItems="center"
      gap="$spacing4"
    >
      <Text
        color="$neutral1"
        fontFamily="$heading"
        fontSize={fontSize}
        fontWeight={fonts.heading2.fontWeight}
        lineHeight={fonts.heading2.lineHeight}
      >
        {name}
      </Text>
      <Flex
        {...iconContainerProps}
        row
        animation="lazy"
        enterStyle={animateIcon ? { opacity: 0, scale: 0.8, x: 20 } : undefined}
        exitStyle={animateIcon ? { opacity: 0, scale: 0.8, x: -20 } : undefined}
      >
        <Unitag size="$icon.24" />
      </Flex>
    </Flex>
  )
}

import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons'
import { fonts, spacing } from 'ui/src/theme'

export function UnitagName({
  name,
  fontSize,
  opacity = 1,
  animateIcon = false,
}: {
  name?: string
  fontSize: number
  opacity?: number
  animateIcon?: boolean
}): JSX.Element {
  return (
    <Flex
      row
      alignSelf="center"
      animation="lazy"
      enterStyle={{ opacity: 0 }}
      exitStyle={{ opacity: 0 }}
      gap="$spacing20"
      opacity={opacity}
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
        row
        animation="lazy"
        enterStyle={animateIcon ? { opacity: 0, scale: 0.8, x: 20 } : undefined}
        exitStyle={animateIcon ? { opacity: 0, scale: 0.8, x: -20 } : undefined}
        position="absolute"
        right={-spacing.spacing24}
        top={-spacing.spacing4}
      >
        <Unitag size="$icon.24" />
      </Flex>
    </Flex>
  )
}

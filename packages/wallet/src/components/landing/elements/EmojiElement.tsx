import { Flex, Text } from 'ui/src'
import { colors, opacify } from 'ui/src/theme'

export const EmojiElement = ({ emoji }: { emoji: string }): JSX.Element => {
  return (
    <Flex
      borderRadius="$roundedFull"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.yellow200) }}
      transform={[{ rotateZ: '5deg' }]}
    >
      <Text color="$neutral2" textAlign="center" variant="buttonLabel3">
        {emoji}
      </Text>
    </Flex>
  )
}

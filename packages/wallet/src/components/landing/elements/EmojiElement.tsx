import { Flex, Text } from 'ui/src'
import { colors, opacify } from 'ui/src/theme'

export const EmojiElement = ({ emoji }: { emoji: string }): JSX.Element => {
  return (
    <Flex
      backgroundColor={opacify(20, colors.yellowBase)}
      borderRadius="$roundedFull"
      p="$spacing8"
      transform={[{ rotateZ: '5deg' }]}
    >
      <Text color="$neutral2" textAlign="center" variant="buttonLabel2">
        {emoji}
      </Text>
    </Flex>
  )
}

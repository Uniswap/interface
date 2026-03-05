import { Flex, Text } from 'ui/src'
import { colors, opacify } from 'ui/src/theme'

export const EmojiElement = ({ emoji }: { emoji: string }): JSX.Element => {
  return (
    <Flex
      backgroundColor={opacify(20, colors.yellowBase)}
      borderRadius="$roundedFull"
      p="$spacing2"
      transform={[{ rotateZ: '5deg' }]}
    >
      <Text
        color="$neutral2"
        textAlign="center"
        variant="buttonLabel2"
        $xs={{ variant: 'buttonLabel3', p: '$spacing6' }}
        p="$spacing8"
      >
        {emoji}
      </Text>
    </Flex>
  )
}

import { Flex } from 'ui/src'
import { SendAction } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const SendElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.green300) }}
      transform={[{ rotateZ: '-4deg' }]}
    >
      <SendAction color={colors.green200} size={iconSizes.icon28} />
    </Flex>
  )
}

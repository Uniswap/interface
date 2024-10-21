import { Flex, Text } from 'ui/src'

export const TextElement = ({ text }: { text: string }): JSX.Element => {
  return (
    <Flex borderRadius="$rounded12" p="$spacing12" transform={[{ rotateZ: '18deg' }]}>
      <Text color="$neutral2" textAlign="center" variant="buttonLabel2">
        {text}
      </Text>
    </Flex>
  )
}

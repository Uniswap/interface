import { Flex, Text } from 'ui/src'

export const TextElement = ({ text }: { text: string }): JSX.Element => {
  return (
    <Flex
      backgroundColor="$surface2"
      borderRadius="$rounded12"
      p="$spacing12"
      $xs={{ p: '$spacing8' }}
      transform={[{ rotateZ: '18deg' }]}
    >
      <Text color="$neutral3" textAlign="center" variant="buttonLabel2" $xs={{ variant: 'buttonLabel4' }}>
        {text}
      </Text>
    </Flex>
  )
}

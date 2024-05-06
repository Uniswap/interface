import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export function DappIconPlaceholder({
  name,
  iconSize,
}: {
  name: string
  iconSize: number
}): JSX.Element {
  return (
    <Flex
      centered
      fill
      row
      backgroundColor="$surface2"
      borderRadius="$roundedFull"
      height={iconSize}
      width={iconSize}>
      <Text
        color="$neutral2"
        textAlign="center"
        variant={iconSize >= iconSizes.icon40 ? 'subheading1' : 'body2'}>
        {name.length > 0 ? name.charAt(0) : ' '}
      </Text>
    </Flex>
  )
}

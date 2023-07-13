import { Text } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { iconSizes } from 'ui/src/theme/iconSizes'

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
      row
      backgroundColor="$background3"
      borderRadius="$roundedFull"
      flex={1}
      height={iconSize}
      width={iconSize}>
      <Text
        color="$textSecondary"
        textAlign="center"
        variant={iconSize >= iconSizes.icon40 ? 'subheadLarge' : 'bodySmall'}>
        {name.length > 0 ? name.charAt(0) : ' '}
      </Text>
    </Flex>
  )
}

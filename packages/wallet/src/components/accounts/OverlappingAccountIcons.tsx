import { FlatList, ListRenderItemInfo } from 'react-native'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'

export const OverlappingAccountIcons = ({
  accountAddresses,
  iconSize,
  iconShift = iconSizes.icon12,
}: {
  accountAddresses: string[]
  iconSize: number
  iconShift?: number
}): JSX.Element => {
  const renderItem = ({ item, index }: ListRenderItemInfo<string>): JSX.Element => {
    return (
      <Flex
        key={item}
        ml={index > 0 ? -iconShift : 0}
        backgroundColor="$surface1"
        borderRadius="$roundedFull"
        overflow="hidden"
      >
        <AccountIcon address={item} size={iconSize} />
      </Flex>
    )
  }

  return (
    <Flex>
      <FlatList
        horizontal
        data={accountAddresses}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
      />
    </Flex>
  )
}

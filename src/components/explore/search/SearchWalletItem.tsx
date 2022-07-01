import React from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import ProfileIcon from 'src/assets/icons/profile.svg'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { Unicon } from 'src/components/unicons/Unicon'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { shortenAddress } from 'src/utils/addresses'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
}

export function SearchWalletItem({ wallet }: SearchWalletItemProps) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const navigation = useExploreStackNavigation()

  const { address, ensName } = wallet

  const onPress = () => {
    dispatch(addToSearchHistory({ searchResult: wallet }))
    navigation.navigate(Screens.User, { address })
  }

  return (
    <Button name={ElementName.SearchWalletItem} testID={`wallet-item-${address}`} onPress={onPress}>
      <Flex row alignItems="center" gap="sm" justifyContent="space-between" px="xs" py="sm">
        <Flex centered row gap="md">
          <Unicon address={address} size={35} />
          <Flex gap="xxs">
            <Text variant="mediumLabel">{ensName}</Text>
            <Text color="textSecondary" variant="caption">
              {shortenAddress(address)}
            </Text>
          </Flex>
        </Flex>
        <ProfileIcon color={theme.colors.textSecondary} height={24} width={24} />
      </Flex>
    </Button>
  )
}

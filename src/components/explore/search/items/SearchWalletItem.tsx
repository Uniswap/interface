import React from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useEagerUserProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout/Flex'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { ElementName } from 'src/features/telemetry/constants'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
}

export function SearchWalletItem({ wallet }: SearchWalletItemProps) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerUserProfileNavigation()

  const { address } = wallet

  const onPressIn = () => {
    preload(address)
  }

  const onPress = () => {
    navigate(address)
    dispatch(addToSearchHistory({ searchResult: wallet }))
  }

  return (
    <Button
      name={ElementName.SearchWalletItem}
      testID={`wallet-item-${address}`}
      onPress={onPress}
      onPressIn={onPressIn}>
      <Flex row px="xs" py="sm">
        <AddressDisplay
          showAddressAsSubtitle
          address={address}
          size={theme.imageSizes.xl}
          variant="subhead"
          verticalGap="none"
        />
      </Flex>
    </Button>
  )
}

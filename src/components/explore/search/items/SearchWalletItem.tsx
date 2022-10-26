import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { FavoriteButton } from 'src/components/explore/FavoriteButton'
import { Flex } from 'src/components/layout/Flex'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { ElementName } from 'src/features/telemetry/constants'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
  isEditing?: boolean
  isFavorited?: boolean
}

export function SearchWalletItem({ wallet, isEditing, isFavorited }: SearchWalletItemProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const { address } = wallet

  const onPressIn = () => {
    preload(address)
  }

  const onPress = () => {
    navigate(address)
    dispatch(addToSearchHistory({ searchResult: wallet }))
  }

  const toggleFavoriteWallet = useToggleWatchedWalletCallback(address)

  const menuActions = useMemo(() => {
    return isFavorited
      ? [{ title: t('Remove favorite'), systemIcon: 'minus' }]
      : [{ title: 'Favorite wallet', systemIcon: 'star' }]
  }, [isFavorited, t])

  return (
    <ContextMenu actions={menuActions} onPress={toggleFavoriteWallet}>
      <TouchableArea
        name={ElementName.SearchWalletItem}
        testID={`wallet-item-${address}`}
        onPress={onPress}
        onPressIn={onPressIn}>
        <Flex row justifyContent="space-between" px="xs" py="sm">
          <AddressDisplay
            address={address}
            size={theme.imageSizes.xl}
            subtitleOverrideText={wallet.category}
            variant="bodyLarge"
          />
          {isEditing ? (
            <FavoriteButton disabled={Boolean(isFavorited)} onPress={toggleFavoriteWallet} />
          ) : null}
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

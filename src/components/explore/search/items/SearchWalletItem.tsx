import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout/Flex'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { ElementName } from 'src/features/telemetry/constants'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
}

export function SearchWalletItem({ wallet }: SearchWalletItemProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const { address } = wallet

  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  const onPress = (): void => {
    preload(address)
    navigate(address)
    dispatch(addToSearchHistory({ searchResult: wallet }))
  }

  const toggleFavoriteWallet = useToggleWatchedWalletCallback(address)

  const menuActions = useMemo(() => {
    return isFavorited
      ? [{ title: t('Remove favorite'), systemIcon: 'heart.fill' }]
      : [{ title: 'Favorite wallet', systemIcon: 'heart' }]
  }, [isFavorited, t])

  return (
    <ContextMenu actions={menuActions} onPress={toggleFavoriteWallet}>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        name={ElementName.SearchWalletItem}
        testID={`wallet-item-${address}`}
        onPress={onPress}>
        <Flex row justifyContent="space-between" px="spacing8" py="spacing12">
          <AddressDisplay
            address={address}
            size={theme.iconSizes.icon40}
            subtitleOverrideText={wallet.category}
            variant="bodyLarge"
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

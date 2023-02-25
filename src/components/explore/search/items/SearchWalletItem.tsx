import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { Flex } from 'src/components/layout/Flex'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName, MobileEventName } from 'src/features/telemetry/constants'
import { useDisplayName } from 'src/features/wallet/hooks'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
  searchContext?: SearchContext
}

export function SearchWalletItem({ wallet, searchContext }: SearchWalletItemProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  const { address } = wallet
  const displayName = useDisplayName(address)

  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  const onPress = (): void => {
    preload(address)
    navigate(address, displayName?.name)
    if (searchContext) {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name: displayName?.name ?? address,
        address: address ?? '',
        type: 'address',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
      })
    }
    dispatch(addToSearchHistory({ searchResult: wallet }))
  }

  const toggleFavoriteWallet = useToggleWatchedWalletCallback(address)

  const menuActions = useMemo(() => {
    return isFavorited
      ? [{ title: t('Remove favorite'), systemIcon: 'heart.fill' }]
      : [{ title: t('Favorite wallet'), systemIcon: 'heart' }]
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
            hideAddressInSubtitle
            address={address}
            size={theme.iconSizes.icon40}
            variant="bodyLarge"
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

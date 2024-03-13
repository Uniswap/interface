import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { PropsWithChildren, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { TouchableArea } from 'ui/src'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { addToSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import {
  extractDomain,
  SearchResultType,
  WalletSearchResult,
} from 'wallet/src/features/search/SearchResult'

type SearchWalletItemBaseProps = {
  searchResult: WalletSearchResult
  searchContext?: SearchContext
}

export function SearchWalletItemBase({
  children,
  searchResult,
  searchContext,
}: PropsWithChildren<SearchWalletItemBaseProps>): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()
  const { address, type } = searchResult
  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  const onPress = (): void => {
    navigate(address)
    if (searchContext) {
      const walletName =
        type === SearchResultType.Unitag
          ? searchResult.unitag
          : type === SearchResultType.ENSAddress
          ? searchResult.ensName
          : undefined
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name: walletName,
        address,
        type: 'address',
        domain: walletName ? extractDomain(walletName, type) : undefined,
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
        isHistory: searchContext.isHistory,
      })
    }

    if (type === SearchResultType.ENSAddress) {
      dispatch(
        addToSearchHistory({
          searchResult: {
            ...searchResult,
            primaryENSName: searchResult.primaryENSName,
          },
        })
      )
    } else {
      dispatch(
        addToSearchHistory({
          searchResult,
        })
      )
    }
  }

  const toggleFavoriteWallet = useToggleWatchedWalletCallback(address)

  const menuActions = useMemo(() => {
    return isFavorited
      ? [{ title: t('explore.wallets.favorite.action.remove'), systemIcon: 'heart.fill' }]
      : [{ title: t('explore.wallets.favorite.action.add'), systemIcon: 'heart' }]
  }, [isFavorited, t])

  return (
    <ContextMenu actions={menuActions} onPress={toggleFavoriteWallet}>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={`wallet-item-${type}-${address}`}
        onLongPress={disableOnPress}
        onPress={onPress}
        onPressIn={async (): Promise<void> => {
          await preload(address)
        }}>
        {children}
      </TouchableArea>
    </ContextMenu>
  )
}

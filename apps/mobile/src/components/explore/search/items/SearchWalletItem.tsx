import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { useEagerExternalProfileNavigation } from 'src/app/navigation/hooks'
import { AccountIcon } from 'src/components/AccountIcon'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { Box } from 'src/components/layout'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { addToSearchHistory, WalletSearchResult } from 'src/features/explore/searchHistorySlice'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { useENSAvatar, useENSName } from 'wallet/src/features/ens/api'
import { getCompletedENSName } from 'wallet/src/features/ens/useENS'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'

type SearchWalletItemProps = {
  wallet: WalletSearchResult
  searchContext?: SearchContext
}

export function SearchWalletItem({ wallet, searchContext }: SearchWalletItemProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { preload, navigate } = useEagerExternalProfileNavigation()

  // Use `savedPrimaryEnsName` for WalletSearchResults that are stored in the search history
  // so that we don't have to do an additional ENS fetch when loading search history
  const { address, ensName, primaryENSName: savedPrimaryENSName } = wallet
  const formattedAddress = sanitizeAddressText(shortenAddress(address))

  /*
   * Fetch primary ENS associated with `address` since it may resolve to an
   * ENS different than the `ensName` searched
   * ex. if searching `uni.eth` resolves to 0x123, and the primary ENS for 0x123
   * is `uniswap.eth`, then we should show "uni.eth | owned by uniswap.eth"
   */
  const completedENSName = getCompletedENSName(ensName ?? null)
  const { data: fetchedPrimaryENSName, loading: isFetchingPrimaryENSName } = useENSName(
    savedPrimaryENSName ? undefined : address
  )

  const primaryENSName = savedPrimaryENSName ?? fetchedPrimaryENSName
  const isPrimaryENSName = completedENSName === primaryENSName
  const showOwnedBy = !isFetchingPrimaryENSName && !isPrimaryENSName

  const { data: avatar } = useENSAvatar(address)

  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  const onPress = (): void => {
    navigate(address)
    if (searchContext) {
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name: ensName ?? address,
        address,
        type: 'address',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
        isHistory: searchContext.isHistory,
      })
    }
    dispatch(
      addToSearchHistory({
        searchResult: { ...wallet, primaryENSName: primaryENSName ?? undefined },
      })
    )
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
        testID={`wallet-item-${address}`}
        onPress={onPress}
        onPressIn={async (): Promise<void> => {
          await preload(address)
        }}>
        <Flex row alignItems="center" gap="spacing12" px="spacing8" py="spacing12">
          <AccountIcon address={address} avatarUri={avatar} size={theme.imageSizes.image40} />
          <Box flexShrink={1}>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              testID={`address-display/name/${ensName}`}
              variant="bodyLarge">
              {completedENSName || formattedAddress}
            </Text>
            {showOwnedBy ? (
              <Text
                color="DEP_textSecondary"
                ellipsizeMode="tail"
                numberOfLines={1}
                variant="subheadSmall">
                {t('Owned by {{owner}}', {
                  owner: primaryENSName || formattedAddress,
                })}
              </Text>
            ) : null}
          </Box>
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

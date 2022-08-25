import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { ExploreTokenCardEmptyState } from 'src/components/explore/ExploreTokenCardEmptyState'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { Screens } from 'src/screens/Screens'

/** Renders the favorite tokens card on the Explore page */
export function WatchedWalletsCard({ onSearchWallets }: { onSearchWallets: () => void }) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const renderItem = useCallback(
    ({ item: address }: ListRenderItemInfo<string>) => {
      return (
        <Button
          onPress={() => {
            navigation.navigate(Screens.User, { address })
          }}>
          <Box mx="sm">
            <AddressDisplay
              showShortenedEns
              address={address}
              direction="column"
              size={40}
              variant="smallLabel"
            />
          </Box>
        </Button>
      )
    },
    [navigation]
  )

  const hasWatchedWallets = watchedWalletsList.length > 0

  return hasWatchedWallets ? (
    <BaseCard.Container>
      <BaseCard.Header
        title={t('Watched wallets ({{watchedWalletsCount}})', {
          watchedWalletsCount: watchedWalletsList.length,
        })}
        onPress={
          hasWatchedWallets
            ? () => {
                navigation.navigate(Screens.WatchedWallets)
              }
            : undefined
        }
      />

      <Box mx="xxs" my="md">
        <FlatList
          horizontal
          data={watchedWalletsList}
          keyExtractor={(address) => address}
          renderItem={renderItem}
        />
      </Box>
    </BaseCard.Container>
  ) : (
    <ExploreTokenCardEmptyState
      buttonLabel={t('Search wallets')}
      description={t('Watch wallets to keep track of their activity.')}
      type="watched"
      onPress={onSearchWallets}
    />
  )
}

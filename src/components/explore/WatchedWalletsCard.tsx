import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { useEagerUserProfileNavigation } from 'src/app/navigation/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button } from 'src/components/buttons/Button'
import { ExploreTokenCardEmptyState } from 'src/components/explore/ExploreTokenCardEmptyState'
import { AnimatedFlex, Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { theme } from 'src/styles/theme'

/** Renders the favorite tokens card on the Explore page */
export function WatchedWalletsCard({ onSearchWallets }: { onSearchWallets: () => void }) {
  const { t } = useTranslation()
  const { preload, navigate } = useEagerUserProfileNavigation()
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const renderItem = useCallback(
    ({ item: address }: ListRenderItemInfo<string>) => {
      return (
        <Button
          style={{ marginVertical: theme.spacing.sm }}
          onPress={() => {
            navigate(address)
          }}
          onPressIn={() => preload(address)}>
          <BaseCard.Shadow>
            <AddressDisplay
              showShortenedEns
              address={address}
              direction="column"
              size={40}
              variant="smallLabel"
            />
          </BaseCard.Shadow>
        </Button>
      )
    },
    [navigate, preload]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="none" mx="xs">
      <Text color="textSecondary" variant="smallLabel">
        {t('Pinned')}
      </Text>
      <FlatList
        horizontal
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          <ExploreTokenCardEmptyState
            buttonLabel={t('Search wallets')}
            description={t('Watch wallets to keep track of their activity.')}
            type="watched"
            onPress={onSearchWallets}
          />
        }
        data={watchedWalletsList}
        keyExtractor={(address) => address}
        renderItem={renderItem}
      />
    </AnimatedFlex>
  )
}

function ItemSeparator() {
  return <Box width={theme.spacing.xs} />
}

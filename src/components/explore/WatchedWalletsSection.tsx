import { default as React, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Box } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { Screens } from 'src/screens/Screens'

function renderItem({ item: address }: ListRenderItemInfo<string>) {
  return (
    <Box mx="sm">
      <AddressDisplay address={address} direction="column" variant="smallLabel" />
    </Box>
  )
}

/** Renders the favorite tokens section on the Explore page */
export function WatchedWalletsSection({ onSearchWallets }: { onSearchWallets: () => void }) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  const hasWatchedWallets = watchedWalletsList.length > 0

  return (
    <Section.Container>
      <Section.Header
        title={t("Wallets you're watching ({{watchedWalletsCount}})", {
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
      {hasWatchedWallets ? (
        <Box mt="md" mx="xxs">
          <FlatList
            horizontal
            data={watchedWalletsList}
            keyExtractor={(address) => address}
            renderItem={renderItem}
          />
        </Box>
      ) : (
        <Section.EmptyState
          buttonLabel={t('Search wallets')}
          description={t("When you watch wallets, they'll appear here.")}
          onPress={onSearchWallets}
        />
      )}
    </Section.Container>
  )
}

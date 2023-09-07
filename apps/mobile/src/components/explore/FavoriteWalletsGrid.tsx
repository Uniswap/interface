import { default as React, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteWalletCard from 'src/components/explore/FavoriteWalletCard'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }
const HALF_WIDTH = { width: '50%' }

/** Renders the favorite wallets section on the Explore tab */
export function FavoriteWalletsGrid({ showLoading }: { showLoading: boolean }): JSX.Element {
  const { t } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
  const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

  // Reset edit mode when there are no favorite wallets
  useEffect(() => {
    if (watchedWalletsSet.size === 0) {
      setIsEditing(false)
    }
  }, [watchedWalletsSet.size])

  return (
    <AnimatedBox entering={FadeIn} gap="$none">
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite wallets')}
        isEditing={isEditing}
        title={t('Favorite wallets')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteWalletsGridLoader />
      ) : (
        <Box flexDirection="row" flexWrap="wrap">
          {watchedWalletsList.map((address) => (
            <FavoriteWalletCard
              key={address}
              address={address}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              style={HALF_WIDTH}
            />
          ))}
        </Box>
      )}
    </AnimatedBox>
  )
}

function FavoriteWalletsGridLoader(): JSX.Element {
  return (
    <Flex row gap="spacing8">
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={48} />
      </Box>
      <Box style={ITEM_FLEX}>
        <Loader.Favorite height={48} />
      </Box>
    </Flex>
  )
}

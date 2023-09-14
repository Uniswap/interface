import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, {
  FAVORITE_TOKEN_CARD_LOADER_HEIGHT,
} from 'src/components/explore/FavoriteTokenCard'
import { AnimatedBox } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { selectFavoriteTokens } from 'src/features/favorites/selectors'
import { Flex } from 'ui/src'

const NUM_COLUMNS = 2
const ITEM_FLEX = { flex: 1 / NUM_COLUMNS }
const HALF_WIDTH = { width: '50%' }

/** Renders the favorite tokens section on the Explore tab */
export function FavoriteTokensGrid({ showLoading }: { showLoading: boolean }): JSX.Element | null {
  const { t } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIds = useAppSelector(selectFavoriteTokens)

  // Reset edit mode when there are no favorite tokens
  useEffect(() => {
    if (favoriteCurrencyIds.length === 0) {
      setIsEditing(false)
    }
  }, [favoriteCurrencyIds.length])

  return (
    <AnimatedBox entering={FadeIn} gap="$none">
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite tokens')}
        isEditing={isEditing}
        title={t('Favorite tokens')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteTokensGridLoader />
      ) : (
        <Flex row flexWrap="wrap" gap="$none">
          {favoriteCurrencyIds.map((currencyId) => (
            <FavoriteTokenCard
              key={currencyId}
              currencyId={currencyId}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              style={HALF_WIDTH}
            />
          ))}
        </Flex>
      )}
    </AnimatedBox>
  )
}

function FavoriteTokensGridLoader(): JSX.Element {
  return (
    <Flex row gap="$spacing8">
      <Flex gap="$none" style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
      <Flex style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
    </Flex>
  )
}

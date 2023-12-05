import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteHeaderRow } from 'src/components/explore/FavoriteHeaderRow'
import FavoriteTokenCard, {
  FAVORITE_TOKEN_CARD_LOADER_HEIGHT,
} from 'src/components/explore/FavoriteTokenCard'
import { Loader } from 'src/components/loading'
import { AnimatedFlex, Flex } from 'ui/src'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'

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
    <AnimatedFlex entering={FadeIn}>
      <FavoriteHeaderRow
        editingTitle={t('Edit favorite tokens')}
        isEditing={isEditing}
        title={t('Favorite tokens')}
        onPress={(): void => setIsEditing(!isEditing)}
      />
      {showLoading ? (
        <FavoriteTokensGridLoader />
      ) : (
        <Flex row flexWrap="wrap">
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
    </AnimatedFlex>
  )
}

function FavoriteTokensGridLoader(): JSX.Element {
  return (
    <Flex row>
      <Flex m="$spacing4" style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
      <Flex m="$spacing4" style={ITEM_FLEX}>
        <Loader.Favorite contrast height={FAVORITE_TOKEN_CARD_LOADER_HEIGHT} />
      </Flex>
    </Flex>
  )
}

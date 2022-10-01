import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { PinnedTokenCard } from 'src/components/explore/PinnedTokenCard'
import { AnimatedFlex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'

import { FadeIn } from 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { ElementName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'
import { CurrencyId } from 'src/utils/currencyId'

/** Renders the favorite tokens card on the Explore page */
export function FavoriteTokensCard() {
  const [isEditing, setIsEditing] = useState(false)

  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const favoriteCurrencyIds = useMemo(
    () => Array.from(favoriteCurrencyIdsSet),
    [favoriteCurrencyIdsSet]
  )

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CurrencyId>) => {
      return <PinnedTokenCard currencyId={item} isEditing={isEditing} />
    },
    [isEditing]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="sm" mx="xs">
      <HeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      <FlatList
        horizontal
        ItemSeparatorComponent={() => <Separator mr="sm" />}
        ListEmptyComponent={FavoritesEmptyState}
        contentContainerStyle={{ ...flex.grow }}
        data={favoriteCurrencyIds}
        keyExtractor={(item) => item}
        listKey="explore-pinned-tokens"
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedFlex>
  )
}

function HeaderRow({ isEditing, onPress }: { isEditing: boolean; onPress: () => void }) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="textSecondary" variant="subheadSmall">
        {isEditing ? t('Edit pinned tokens') : t('Pinned tokens')}
      </Text>
      {!isEditing ? (
        <Button name={ElementName.Edit} onPress={onPress}>
          <TripleDots
            color={theme.colors.textSecondary}
            height={12}
            strokeLinecap="round"
            strokeWidth="1"
            width={14}
          />
        </Button>
      ) : (
        <TextButton textColor="accentActive" textVariant="smallLabel" onPress={onPress}>
          {t('Done')}
        </TextButton>
      )}
    </Flex>
  )
}

export function FavoritesEmptyState() {
  const { t } = useTranslation()
  return <BaseCard.EmptyState description={t('Pin tokens to monitor their prices.')} />
}

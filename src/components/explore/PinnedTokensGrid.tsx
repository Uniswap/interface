import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import TripleDots from 'src/assets/icons/triple-dots.svg'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import PinnedTokenCard from 'src/components/explore/PinnedTokenCard'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { ElementName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'
import { theme as FixedTheme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

const NUM_COLUMNS = 3
const GAP_SIZE = FixedTheme.spacing.xs
const ITEM_FLEX = 1 / NUM_COLUMNS

/** Renders the favorite tokens card on the Explore page */
export function PinnedTokensGrid({
  isEditing,
  setIsEditing,
}: {
  isEditing: boolean
  setIsEditing: (update: boolean) => void
}) {
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const favoriteCurrencyIds = useMemo(
    () => Array.from(favoriteCurrencyIdsSet),
    [favoriteCurrencyIdsSet]
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CurrencyId>) => {
      const lastColumn = (index + 1) % NUM_COLUMNS === 0
      return (
        <>
          <PinnedTokenCard currencyId={item} isEditing={isEditing} style={{ flex: ITEM_FLEX }} />
          {lastColumn ? null : <Box width={GAP_SIZE} />}
        </>
      )
    },
    [isEditing]
  )

  return (
    <AnimatedFlex entering={FadeIn} gap="sm" mx="xs">
      <HeaderRow isEditing={isEditing} onPress={() => setIsEditing(!isEditing)} />
      <FlatList
        ItemSeparatorComponent={() => <Box height={GAP_SIZE} />}
        ListEmptyComponent={FavoritesEmptyState}
        contentContainerStyle={{ ...flex.grow }}
        data={favoriteCurrencyIds}
        keyExtractor={(item) => item}
        listKey="explore-pinned-tokens"
        numColumns={NUM_COLUMNS}
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

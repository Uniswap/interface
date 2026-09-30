import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Skeleton, spacing, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { FilterChip, type FilterChipColor } from 'uniswap/src/components/FilterChip/FilterChip'
import { tokenCardShellProps } from 'uniswap/src/components/TokenCard/constants'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import { useRelatedTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/useRelatedTokensQuery'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import { getRelatedTokensTitle } from 'uniswap/src/features/tokenCategories/getRelatedTokensTitle'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'

const CARD_WIDTH = 204
const SKELETON_CARD_COUNT = 3
// Logo row + name/price block of TokenCardVertical, so the skeleton reserves the rendered height.
const SKELETON_CARD_HEIGHT = 124

const chipsContentContainerStyle: ViewStyle = {
  gap: spacing.spacing4,
  paddingHorizontal: spacing.spacing16,
}

const cardsContentContainerStyle: ViewStyle = {
  gap: spacing.spacing12,
  paddingHorizontal: spacing.spacing16,
}

const categoryKeyExtractor = (category: TokenCategory): string => category.id
const tokenKeyExtractor = (token: RankedTokenCardItem): string => token.key

/**
 * Related tokens on the TDP: one chip per category the token belongs to, switching a horizontal
 * card list of up to 16 tokens in that category. Single-category tokens get a singularized title
 * and no chips. Supersedes OtherStocks on tagged RWA TDPs.
 */
export const RelatedTokens = memo(function RelatedTokens(): JSX.Element | null {
  const { t } = useTranslation()
  const { currencyId } = useTokenDetailsContext()
  const subject = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])

  const { categories } = useTokenCategories(currencyId)
  const [pickedCategoryId, setPickedCategoryId] = useState<string | undefined>()
  // Derived rather than synced in an effect: falls back to the first category whenever the pick is
  // stale (token changed, categories reordered) without a one-frame flash of the old list.
  const selectedCategory = categories.find((category) => category.id === pickedCategoryId) ?? categories[0]

  const { tokens, isLoading, isError } = useRelatedTokensQuery({ categoryId: selectedCategory?.id, subject })

  const onSelectCategory = useEvent((categoryId: string) => {
    if (categoryId === selectedCategory?.id) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPRelatedTokensCategoryChip,
      category_id: categoryId,
    })
    setPickedCategoryId(categoryId)
  })

  // FlatList calls these during render, so they must be plain memoized callbacks, not useEvent refs.
  const selectedCategoryId = selectedCategory?.id
  const renderChip = useCallback(
    ({ item }: { item: TokenCategory }) => (
      <CategoryChip category={item} selected={item.id === selectedCategoryId} onSelect={onSelectCategory} />
    ),
    [selectedCategoryId, onSelectCategory],
  )
  const renderCard = useCallback(
    ({ item }: { item: RankedTokenCardItem }) => (
      <RelatedTokenCard token={item} categoryId={selectedCategoryId ?? ''} listLength={tokens.length} />
    ),
    [selectedCategoryId, tokens.length],
  )

  const showChips = categories.length > 1
  const isListEmpty = !isLoading && (isError || tokens.length === 0)
  if (!selectedCategory) {
    return null
  }

  // With chips the section stays mounted on an empty or failed category so the user can switch back;
  // a single-category token has nowhere to go, so it hides instead.
  if (isListEmpty && !showChips) {
    return null
  }

  const title = showChips ? t('tdp.relatedTokens.header') : getRelatedTokensTitle({ t, category: selectedCategory })

  return (
    <Flex gap="$spacing12" testID={TestID.TokenDetailsRelatedTokens}>
      <Text color="$neutral1" mx="$spacing16" variant="subheading1">
        {title}
      </Text>
      {showChips && (
        <FlatList
          horizontal
          contentContainerStyle={chipsContentContainerStyle}
          data={categories}
          extraData={selectedCategory.id}
          keyExtractor={categoryKeyExtractor}
          renderItem={renderChip}
          showsHorizontalScrollIndicator={false}
        />
      )}
      {isLoading ? (
        <RelatedTokensSkeleton />
      ) : isListEmpty ? (
        <Text color="$neutral2" mx="$spacing16" variant="body3">
          {isError ? t('explore.tokens.error') : t('explore.tokens.empty.title')}
        </Text>
      ) : (
        <FlatList
          horizontal
          contentContainerStyle={cardsContentContainerStyle}
          data={tokens}
          keyExtractor={tokenKeyExtractor}
          renderItem={renderCard}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </Flex>
  )
})

const CategoryChip = memo(function CategoryChip({
  category,
  selected,
  onSelect,
}: {
  category: TokenCategory
  selected: boolean
  onSelect: (categoryId: string) => void
}): JSX.Element {
  const Icon = getTokenCategoryIcon(category)
  const onPress = useEvent(() => onSelect(category.id))
  const renderIcon = useCallback((color: FilterChipColor) => <Icon color={color} size="$icon.16" />, [Icon])

  return <FilterChip active={selected} label={category.name} renderIcon={renderIcon} onPress={onPress} />
})

const RelatedTokenCard = memo(function RelatedTokenCard({
  token,
  categoryId,
  listLength,
}: {
  token: RankedTokenCardItem
  categoryId: string
  listLength: number
}): JSX.Element {
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const onPress = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPRelatedTokenCard,
      category_id: categoryId,
      token_address: token.address,
      token_symbol: token.symbol,
      token_list_length: listLength,
    })
    const currencyId = buildCurrencyId(token.chainId, token.address)
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.push(currencyId)
  })

  return (
    <TokenCard
      layout="vertical"
      logoUrl={token.logoUrl}
      name={token.name}
      pricePercentChange1d={token.pricePercentChange1d}
      priceUsd={token.priceUsd}
      sparkline={token.sparkline}
      symbol={token.symbol}
      width={CARD_WIDTH}
      onPress={onPress}
    />
  )
})

function RelatedTokensSkeleton(): JSX.Element {
  return (
    <Skeleton>
      <Flex row gap="$spacing12" px="$spacing16">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <Flex key={index} {...tokenCardShellProps} height={SKELETON_CARD_HEIGHT} width={CARD_WIDTH} />
        ))}
      </Flex>
    </Skeleton>
  )
}

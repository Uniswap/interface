import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { FilterChip, type FilterChipColor } from 'uniswap/src/components/FilterChip/FilterChip'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { useRelatedTokensQuery } from 'uniswap/src/data/apiClients/dataApiService/relatedTokens/useRelatedTokensQuery'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { CAROUSEL_CARD_GAP, CAROUSEL_FADE_WIDTH } from '~/components/TokenCardCarousel/constants'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { TokenCardSkeletonRow } from '~/components/TokenCardCarousel/TokenCardSkeleton'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { LoadingBubble } from '~/components/Tokens/loading'
import { getTokenDetailsURL } from '~/data/util'
import { rightEdgeFadeStyle, useWheelHorizontalScroll } from '~/pages/Explore/categories/useWheelHorizontalScroll'
import {
  deriveRelatedTokensSectionState,
  selectRelatedTokensCategory,
} from '~/pages/TokenDetails/components/relatedTokens/relatedTokensSectionState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

const CARD_WIDTH = 216
const SKELETON_CARD_COUNT = 4

const getTokenKey = (token: RankedTokenCardItem): string => token.key

export function RelatedTokensSection({
  categories,
  isLoading: isCategoriesLoading,
}: {
  categories: TokenCategory[]
  /** The token has category ids that are still being hydrated; reserves the slot instead of popping in. */
  isLoading: boolean
}): JSX.Element | null {
  const { t } = useTranslation()
  const currency = useTDPStore((s) => s.currency!)
  const subject = useMemo(() => currencyIdToRestContractInput(currencyId(currency)), [currency])

  const [pickedCategoryId, setPickedCategoryId] = useState<string | undefined>()
  const selectedCategoryId = selectRelatedTokensCategory({ categories, pickedCategoryId })?.id
  const { tokens, isLoading, isError } = useRelatedTokensQuery({ categoryId: selectedCategoryId, subject })

  const state = deriveRelatedTokensSectionState({
    categories,
    pickedCategoryId,
    isLoading,
    isError,
    tokenCount: tokens.length,
    t,
  })

  const { scrollerRef: chipsScrollerRef, showRightFade } = useWheelHorizontalScroll()

  const onSelectCategory = useEvent((categoryId: string): void => {
    if (categoryId === selectedCategoryId) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPRelatedTokensCategoryChip,
      category_id: categoryId,
    })
    setPickedCategoryId(categoryId)
  })

  if (isCategoriesLoading) {
    return <RelatedTokensSectionSkeleton />
  }

  if (!state) {
    return null
  }

  const { selectedCategory, showChips, isListEmpty, title } = state

  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRelatedTokens}>
      <Text variant="heading3">{title}</Text>
      {showChips && (
        <Flex
          ref={chipsScrollerRef}
          maxWidth="100%"
          className="scrollbar-hidden"
          $platform-web={{ overflowX: 'auto', overscrollBehaviorX: 'none', ...rightEdgeFadeStyle(showRightFade) }}
        >
          <Flex row alignItems="center" gap="$spacing4">
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                selected={category.id === selectedCategory.id}
                onSelect={onSelectCategory}
              />
            ))}
          </Flex>
        </Flex>
      )}
      {isListEmpty ? (
        <Text variant="body2" color="$neutral2">
          {isError ? t('explore.tokens.error') : t('explore.tokens.empty.title')}
        </Text>
      ) : (
        // Keyed per category so a chip switch starts the new list at its first card.
        <RelatedTokensCarousel
          key={selectedCategory.id}
          tokens={tokens}
          isLoading={isLoading}
          categoryId={selectedCategory.id}
        />
      )}
    </Flex>
  )
}

function RelatedTokensSectionSkeleton(): JSX.Element {
  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRelatedTokens}>
      <LoadingBubble height={24} width={200} />
      <Flex row gap={CAROUSEL_CARD_GAP} flexWrap="nowrap" overflow="hidden" width="100%">
        <TokenCardSkeletonRow cardWidth={CARD_WIDTH} count={SKELETON_CARD_COUNT} layout="vertical" />
      </Flex>
    </Flex>
  )
}

function RelatedTokensCarousel({
  tokens,
  isLoading,
  categoryId,
}: {
  tokens: RankedTokenCardItem[]
  isLoading: boolean
  categoryId: string
}): JSX.Element {
  const carousel = useHorizontalSnapCarousel({ cardWidth: CARD_WIDTH, itemCount: tokens.length, isLoading })

  return (
    <TokenCardCarousel
      items={tokens}
      getItemKey={getTokenKey}
      renderItem={(token) => <RelatedTokenCard token={token} categoryId={categoryId} listLength={tokens.length} />}
      isLoading={isLoading}
      skeletonCount={SKELETON_CARD_COUNT}
      carousel={carousel}
      cardWidth={CARD_WIDTH}
      fadeWidth={CAROUSEL_FADE_WIDTH}
      showArrowButtons
    />
  )
}

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
  const navigate = useNavigate()

  const onPress = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.TDPRelatedTokenCard,
      category_id: categoryId,
      token_address: token.address,
      token_symbol: token.symbol,
      token_list_length: listLength,
    })
    navigate(
      getTokenDetailsURL({
        address: token.address,
        chain: toGraphQLChain(token.chainId),
        chainQueryParam: TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
      }),
    )
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

import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text, useMedia } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterChip } from 'uniswap/src/components/FilterChip/FilterChip'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useEvent } from 'utilities/src/react/hooks'
import { HorizontalFadeScroller } from '~/components/HorizontalFadeScroller/HorizontalFadeScroller'
import { TokenCardSkeletonRow } from '~/components/TokenCardCarousel/TokenCardSkeleton'
import { ExploreTokensModuleCard } from '~/pages/Portfolio/Overview/ExploreTokensModule/ExploreTokensModuleCard'
import {
  EXPLORE_TOKENS_MODULE_DEFAULT_CATEGORY_ID,
  useExploreTokensModule,
} from '~/pages/Portfolio/Overview/ExploreTokensModule/useExploreTokensModule'

const MODULE_TOKEN_COUNT = 8

function CategoryChip({
  category,
  active,
  onSelect,
}: {
  category: TokenCategory
  active: boolean
  onSelect: (categoryId: string) => void
}): JSX.Element {
  const Icon = getCategoryIcon(category)
  const onPress = useEvent((): void => {
    if (active) {
      return
    }
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PortfolioExploreTokensCategory,
      section: SectionName.PortfolioOverviewTab,
      category_id: category.id,
    })
    onSelect(category.id)
  })

  return (
    <FilterChip
      active={active}
      label={category.name}
      renderIcon={(color) => <Icon size="$icon.16" color={color} />}
      onPress={onPress}
    />
  )
}

export function ExploreTokensModule(): JSX.Element | null {
  const { t } = useTranslation()
  const media = useMedia()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(EXPLORE_TOKENS_MODULE_DEFAULT_CATEGORY_ID)
  const { categories, activeCategoryId, tokens, isLoading } = useExploreTokensModule(selectedCategoryId)
  const showChips = categories.length > 1

  if (!isLoading && tokens.length === 0 && !showChips) {
    return null
  }

  return (
    <Flex
      gap="$spacing12"
      p="$spacing32"
      borderRadius="$rounded32"
      backgroundColor="$surface2"
      $sm={{ p: '$spacing16', borderRadius: '$rounded24' }}
      testID={TestID.PortfolioExploreTokensModule}
    >
      <Text variant="heading3" color="$neutral1">
        {t('common.exploreTokens')}
      </Text>
      {showChips && (
        <HorizontalFadeScroller gap="$spacing4" py="$spacing4">
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              category={category}
              active={category.id === activeCategoryId}
              onSelect={setSelectedCategoryId}
            />
          ))}
        </HorizontalFadeScroller>
      )}
      <Flex
        gap="$spacing12"
        $platform-web={{
          display: 'grid',
          gridTemplateColumns: `repeat(${media.lg ? 2 : 4}, minmax(0, 1fr))`,
        }}
      >
        {isLoading ? (
          <TokenCardSkeletonRow cardWidth="100%" count={MODULE_TOKEN_COUNT} layout="vertical" />
        ) : (
          tokens
            .slice(0, MODULE_TOKEN_COUNT)
            .map((token) => <ExploreTokensModuleCard key={token.key} token={token} categoryId={activeCategoryId} />)
        )}
      </Flex>
    </Flex>
  )
}

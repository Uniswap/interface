import { Flex, Text } from '@universe/mycelium'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'ui/src'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useGetCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetCategoryQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CategoryDescriptionText } from 'uniswap/src/features/tokenCategories/CategoryDescriptionText'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { calculateDelta } from 'uniswap/src/utils/calculateDelta'
import { openUri } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

const ICON_TILE_SIZE = 56

// Text onPress, not a wrapping TouchableArea: inline views inside a native <Text> don't reliably
// receive touches on Android.
function LearnMoreLink({ label }: { label: string }): JSX.Element {
  const onPress = useEvent(() => {
    void openUri({ uri: UniswapHelpUrls.articles.tokenCategoryDefinitions })
  })

  return (
    <Text variant="buttonLabel3" color="$neutral1" onPress={onPress}>
      {label}
    </Text>
  )
}

function renderLearnMoreLink(label: string): JSX.Element {
  return <LearnMoreLink label={label} />
}

// Mirrors CategoryStatRow's line height so the block doesn't shift when data lands.
function StatRowSkeleton(): JSX.Element {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Loader.Box borderRadius="$rounded8" height={20} width={90} />
      <Loader.Box borderRadius="$rounded8" height={20} width={140} />
    </Flex>
  )
}

function CategoryStatRow({
  label,
  value,
  series,
}: {
  label: string
  value: number
  series?: ChartPoint[]
}): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const hasSeries = series !== undefined && series.length > 1
  const first = series?.[0]
  const latest = series?.at(-1)
  const delta = hasSeries && first && latest ? calculateDelta(first.value, latest.value) : undefined

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text variant="body2" color="$neutral2">
        {label}
      </Text>
      <Flex row alignItems="center" gap="$spacing8">
        <Text variant="body1" color="$neutral1">
          {convertFiatAmountFormatted(value, NumberType.FiatTokenStats)}
        </Text>
        {delta !== undefined && <RelativeChange semanticColor change={delta} variant="body2" arrowSize="$icon.12" />}
      </Flex>
    </Flex>
  )
}

/** Mirrors the header's icon tile / name / description layout while ListCategories loads. */
export function CategoryDetailsHeaderSkeleton(): JSX.Element {
  return (
    <Flex gap="$spacing16" px="$spacing16" pt="$spacing16">
      <Loader.Box height={ICON_TILE_SIZE} width={ICON_TILE_SIZE} borderRadius="$rounded12" />
      <Loader.Box height={32} width={180} />
      <Loader.Box height={40} width="100%" />
    </Flex>
  )
}

/** Expanded page header: icon tile, name, description (+ RWA disclaimer), and stat rows. */
export const CategoryDetailsHeader = memo(function CategoryDetailsHeader({
  category,
}: {
  category: TokenCategory
}): JSX.Element {
  const { t } = useTranslation()
  const Icon = getTokenCategoryIcon(category)
  const { data: detail, isLoading: isDetailLoading } = useGetCategoryQuery(category.id)
  const aggregates = detail?.category.stats

  return (
    <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
      <Flex gap="$spacing12">
        <Flex
          centered
          borderRadius="$rounded12"
          backgroundColor="$accent2"
          width={ICON_TILE_SIZE}
          height={ICON_TILE_SIZE}
        >
          <Icon color="$accent1" size="$icon.28" />
        </Flex>
        <Text variant="heading2" color="$neutral1">
          {category.name}
        </Text>
        <Text variant="body2" color="$neutral2">
          <CategoryDescriptionText category={category} renderLink={renderLearnMoreLink} />
        </Text>
      </Flex>
      {isDetailLoading ? (
        <Flex gap="$spacing12" borderBottomWidth="$spacing1" borderColor="$surface3" pb="$spacing16">
          <StatRowSkeleton />
          <StatRowSkeleton />
        </Flex>
      ) : aggregates?.volume1d || aggregates?.fdv ? (
        <Flex gap="$spacing12" borderBottomWidth="$spacing1" borderColor="$surface3" pb="$spacing16">
          {aggregates.volume1d ? (
            <CategoryStatRow
              label={t('stats.volume.1d.tableHeader')}
              value={aggregates.volume1d}
              series={detail?.volumeSeries}
            />
          ) : null}
          {aggregates.fdv ? (
            <CategoryStatRow label={t('stats.fdv')} value={aggregates.fdv} series={detail?.fdvSeries} />
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  )
})

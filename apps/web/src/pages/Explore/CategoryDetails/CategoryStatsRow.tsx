import { Flex, fonts, Separator, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useGetCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetCategoryQuery'
import { useGetPoolCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetPoolCategoryQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { CategoryKind } from 'uniswap/src/features/tokenCategories/types'
import { calculateDelta } from 'uniswap/src/utils/calculateDelta'
import { NumberType } from 'utilities/src/format/types'
import { LoadingBubble } from '~/components/Tokens/loading'
import { AssetSparkline } from '~/pages/Explore/rwa/table/AssetSparkline'

const SPARKLINE_WIDTH = 140
const SPARKLINE_HEIGHT = 40
const SKELETON_LABEL_WIDTH = 80
const SKELETON_VALUE_WIDTH = 120

interface CategoryStatItem {
  label: string
  value: number
  series?: ChartPoint[]
}

function StatCell({ children, testID }: { children: ReactNode; testID: string }): JSX.Element {
  return (
    // flexBasis 0 splits the desktop row evenly; it must revert to auto when the container stacks
    // to a column on $md, or every cell collapses to zero height and the contents overlap.
    <Flex
      row
      flexGrow={1}
      flexBasis={0}
      justifyContent="space-between"
      alignItems="center"
      gap="$spacing16"
      $md={{ flexBasis: 'auto' }}
      testID={testID}
    >
      {children}
    </Flex>
  )
}

function CategoryStat({ label, value, series }: CategoryStatItem): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const showSeries = series !== undefined && series.length > 1
  const first = series?.[0]
  const latest = series?.at(-1)
  const delta = showSeries && first && latest ? calculateDelta(first.value, latest.value) : undefined

  return (
    <StatCell testID={TestID.CategoryStat}>
      <Flex gap="$spacing4">
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
        <Flex row gap="$spacing8" alignItems="center">
          <Text variant="heading3" color="$neutral1">
            {convertFiatAmountFormatted(value, NumberType.FiatTokenStats)}
          </Text>
          {delta !== undefined && <RelativeChange semanticColor change={delta} variant="body3" arrowSize="$icon.12" />}
        </Flex>
      </Flex>
      {showSeries && (
        <AssetSparkline data={series} width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} isNegative={(delta ?? 0) < 0} />
      )}
    </StatCell>
  )
}

function CategoryStatSkeleton(): JSX.Element {
  return (
    <StatCell testID={TestID.CategoryStatSkeleton}>
      <Flex gap="$spacing4">
        <Flex height={fonts.body3.lineHeight} justifyContent="center">
          <LoadingBubble
            width={SKELETON_LABEL_WIDTH}
            height={fonts.body3.fontSize}
            containerProps={{ width: SKELETON_LABEL_WIDTH }}
          />
        </Flex>
        <Flex height={fonts.heading3.lineHeight} justifyContent="center">
          <LoadingBubble
            width={SKELETON_VALUE_WIDTH}
            height={fonts.heading3.fontSize}
            containerProps={{ width: SKELETON_VALUE_WIDTH }}
          />
        </Flex>
      </Flex>
      <LoadingBubble
        width={SPARKLINE_WIDTH}
        height={SPARKLINE_HEIGHT}
        containerProps={{ width: SPARKLINE_WIDTH, flexShrink: 0 }}
      />
    </StatCell>
  )
}

/** Tiles separated by vertical rules on desktop, stacked on mobile; a zero-valued stat is left out. */
function StatsRowLayout({
  stats,
  isLoading,
  skeletonCount,
}: {
  stats: CategoryStatItem[]
  isLoading: boolean
  skeletonCount: number
}): JSX.Element | null {
  const items: ReactNode[] = isLoading
    ? Array.from({ length: skeletonCount }, (_, index) => <CategoryStatSkeleton key={index} />)
    : stats.map((stat) => <CategoryStat key={stat.label} {...stat} />)

  if (items.length === 0) {
    return null
  }

  return (
    <Flex row width="100%" gap="$spacing48" $md={{ flexDirection: 'column', gap: '$spacing16' }}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 && <Separator vertical $md={{ display: 'none' }} />}
          {item}
        </Fragment>
      ))}
    </Flex>
  )
}

function TokenCategoryStatsRow({ categoryId }: { categoryId: string }): JSX.Element | null {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useGetCategoryQuery(categoryId)

  const aggregates = detail?.category.stats
  const stats: CategoryStatItem[] = []
  if (aggregates?.volume1d) {
    stats.push({ label: t('stats.volume.1d.tableHeader'), value: aggregates.volume1d, series: detail?.volumeSeries })
  }
  if (aggregates?.fdv) {
    stats.push({ label: t('stats.fdv'), value: aggregates.fdv, series: detail?.fdvSeries })
  }
  return <StatsRowLayout stats={stats} isLoading={isLoading} skeletonCount={2} />
}

function PoolCategoryStatsRow({ categoryId }: { categoryId: string }): JSX.Element | null {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useGetPoolCategoryQuery(categoryId)

  const aggregates = detail?.category.stats
  const stats: CategoryStatItem[] = []
  if (aggregates?.tvl) {
    stats.push({ label: t('common.totalValueLocked'), value: aggregates.tvl, series: detail?.tvlSeries })
  }
  if (aggregates?.volume1d) {
    stats.push({ label: t('stats.volume.1d.tableHeader'), value: aggregates.volume1d, series: detail?.volumeSeries })
  }
  if (aggregates?.fees1d) {
    stats.push({ label: t('stats.24fees'), value: aggregates.fees1d, series: detail?.feesSeries })
  }
  return <StatsRowLayout stats={stats} isLoading={isLoading} skeletonCount={3} />
}

export function CategoryStatsRow({ categoryId, kind }: { categoryId: string; kind: CategoryKind }): JSX.Element | null {
  return kind === 'pool' ? (
    <PoolCategoryStatsRow categoryId={categoryId} />
  ) : (
    <TokenCategoryStatsRow categoryId={categoryId} />
  )
}

import { Flex, fonts, Separator, Text } from '@universe/mycelium'
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useGetCategoryQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useGetCategoryQuery'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { calculateDelta } from 'uniswap/src/utils/calculateDelta'
import { NumberType } from 'utilities/src/format/types'
import { LoadingBubble } from '~/components/Tokens/loading'
import { AssetSparkline } from '~/pages/Explore/rwa/table/AssetSparkline'

const SPARKLINE_WIDTH = 140
const SPARKLINE_HEIGHT = 40
const SKELETON_LABEL_WIDTH = 80
const SKELETON_VALUE_WIDTH = 120

function StatCell({ children }: { children: ReactNode }): JSX.Element {
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
    >
      {children}
    </Flex>
  )
}

function CategoryStat({ label, value, series }: { label: string; value: number; series?: ChartPoint[] }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const showSeries = series !== undefined && series.length > 1
  const first = series?.[0]
  const latest = series?.at(-1)
  const delta = showSeries && first && latest ? calculateDelta(first.value, latest.value) : undefined

  return (
    <StatCell>
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
    <StatCell>
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

export function CategoryStatsRow({ categoryId }: { categoryId: string }): JSX.Element | null {
  const { t } = useTranslation()
  const { data: detail, isLoading } = useGetCategoryQuery(categoryId)

  if (isLoading) {
    return (
      <Flex row width="100%" gap="$spacing48" $md={{ flexDirection: 'column', gap: '$spacing16' }}>
        <CategoryStatSkeleton />
        <Separator vertical $md={{ display: 'none' }} />
        <CategoryStatSkeleton />
      </Flex>
    )
  }

  const aggregates = detail?.category.stats
  const stats: { label: string; value: number; series?: ChartPoint[] }[] = []
  if (aggregates?.volume1d) {
    stats.push({ label: t('stats.volume.1d.tableHeader'), value: aggregates.volume1d, series: detail?.volumeSeries })
  }
  if (aggregates?.fdv) {
    stats.push({ label: t('stats.fdv'), value: aggregates.fdv, series: detail?.fdvSeries })
  }
  if (stats.length === 0) {
    return null
  }

  return (
    <Flex row width="100%" gap="$spacing48" $md={{ flexDirection: 'column', gap: '$spacing16' }}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 && <Separator vertical $md={{ display: 'none' }} />}
          <CategoryStat label={stat.label} value={stat.value} series={stat.series} />
        </Fragment>
      ))}
    </Flex>
  )
}

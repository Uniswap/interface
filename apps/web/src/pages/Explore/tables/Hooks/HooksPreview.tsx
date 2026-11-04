import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'
import { Button, Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { noop } from 'utilities/src/react/noop'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { EllipsisText, TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { parseHooksFixtureScenario } from '~/features/Hooks/fixtures'
import { HOOKS_PAGE_SIZE, hookListQueryOptions } from '~/features/Hooks/queries'
import { HooksFixtureScenario } from '~/features/Hooks/types'

interface PreviewRow {
  id: string
  name: string
  address: string
  pools: string
  volume: string
  tvl: string
}

const columnHelper = createColumnHelper<PreviewRow>()

function HooksPreviewContent({ scenario }: { scenario: HooksFixtureScenario }): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const locale = useCurrentLocale()
  const [page, setPage] = useState(1)
  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    ...hookListQueryOptions({ scenario, page }),
    placeholderData: keepPreviousData,
  })
  const showSkeleton = isPending || isError

  const rows = useMemo(() => {
    // The stats formatter displays an exact zero as unavailable.
    const formatUsd = (value: number | null): string =>
      value === null
        ? '-'
        : convertFiatAmountFormatted(value, value === 0 ? NumberType.FiatStandard : NumberType.FiatTokenStats)

    return (
      data?.hooks.map((hook): PreviewRow => {
        const deployment = hook.deployments[0]
        const address = shortenAddress({ address: deployment.address })
        return {
          id: hook.id,
          name: hook.name ?? address,
          address: hook.name ? address : '',
          pools: hook.metrics.poolCount?.toLocaleString(locale) ?? '-',
          volume: formatUsd(hook.metrics.volumeUsd['1d']),
          tvl: formatUsd(hook.metrics.tvlUsd),
        }
      }) ?? []
    )
  }, [convertFiatAmountFormatted, data, locale])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        size: 280,
        meta: { flexGrow: 1 },
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2">
              {t('hooks.preview.name')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell loading={showSkeleton} justifyContent="flex-start">
            {!showSkeleton && (
              <Flex minWidth={0}>
                <EllipsisText>{info.getValue()}</EllipsisText>
                <Text variant="body4" color="$neutral2">
                  {info.row.original.address}
                </Text>
              </Flex>
            )}
          </Cell>
        ),
      }),
      ...(
        [
          ['pools', t('common.pools')],
          ['volume', t('stats.volume.1d.short')],
          ['tvl', t('common.totalValueLocked')],
        ] as const
      ).map(([key, label]) =>
        columnHelper.accessor(key, {
          size: 120,
          header: () => (
            <HeaderCell>
              <Text variant="body3" color="$neutral2">
                {label}
              </Text>
            </HeaderCell>
          ),
          cell: (info) => (
            <Cell loading={showSkeleton}>{!showSkeleton && <TableText>{info.getValue()}</TableText>}</Cell>
          ),
        }),
      ),
    ],
    [showSkeleton, t],
  )

  return (
    <Flex width="100%" gap="$spacing24" py="$spacing24" testID={TestID.HooksPreview}>
      <Helmet>
        <title>{t('hooks.preview.pageTitle')}</title>
        <meta name="description" content={t('hooks.preview.description')} />
        <meta property="og:description" content={t('hooks.preview.description')} />
      </Helmet>
      <Flex gap="$spacing8">
        <Text tag="h1" variant="heading2" m={0}>
          {t('hooks.title')}
        </Text>
        <Flex gap="$spacing4" p="$spacing16" backgroundColor="$surface2" borderRadius="$rounded16" role="note">
          <Text variant="subheading2">{t('hooks.preview.label')}</Text>
          <Text variant="body3" color="$neutral2">
            {t('hooks.preview.description')}
          </Text>
        </Flex>
      </Flex>
      <Flex aria-busy={isPending}>
        <Table
          columns={columns}
          data={rows}
          loading={isPending}
          error={isError}
          errorState={{ onRetry: refetch }}
          emptyState={{
            title: scenario === HooksFixtureScenario.NotFound ? t('hooks.preview.notFound') : t('hook.search.empty'),
          }}
          getRowId={(row) => row.id}
          loadingRowsCount={HOOKS_PAGE_SIZE}
          rowHeight={64}
        />
      </Flex>
      {data && data.totalCount > 0 && (
        <Flex
          row
          gap="$spacing8"
          justifyContent="flex-end"
          role="navigation"
          aria-label={t('hooks.preview.pagination')}
        >
          <Button
            variant="default"
            emphasis="secondary"
            size="small"
            fill={false}
            disabled={page === 1 || isPlaceholderData}
            onDisabledPress={noop}
            onPress={() => setPage(page - 1)}
          >
            {t('common.button.previous')}
          </Button>
          <Button
            variant="default"
            emphasis="secondary"
            size="small"
            fill={false}
            disabled={data.nextPage === null || isPlaceholderData}
            onDisabledPress={noop}
            onPress={() => setPage(data.nextPage ?? page)}
          >
            {t('common.button.next')}
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

export default function HooksPreview(): JSX.Element {
  const [params] = useSearchParams()
  const scenario = parseHooksFixtureScenario(params.get('hooksFixtureScenario'))

  return <HooksPreviewContent key={scenario} scenario={scenario} />
}

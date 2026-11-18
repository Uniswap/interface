/* oxlint-disable typescript/no-unnecessary-condition */
import { createColumnHelper } from '@tanstack/react-table'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Text, useMedia } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Cell } from '~/components/Table/Cell'
import {
  FLUSH_CELL_PADDING,
  FLUSH_COLLAPSED_COLUMN_WIDTH,
  FLUSH_HEADER_CELL_PADDING,
} from '~/components/Table/PinnedColumns/collapse/utils'
import { HeaderCell } from '~/components/Table/styled'
import type { OrderDirection } from '~/data/util'
import { AuctionTableHeader } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/AuctionTableHeader'
import { CommittedVolumeCell } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/CommittedVolumeCell'
import { LaunchThresholdCell } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/LaunchThresholdCell'
import { ProjectedFdvCell } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/ProjectedFdvCell'
import { TimeRemainingCell } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/components/TimeRemainingCell'
import {
  type AuctionLaunchpadDisplay,
  AuctionSortField,
  type TopAuctionsTableValue,
} from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'
import {
  LAUNCHPAD_COLUMN_META,
  LAUNCHPAD_COLUMN_WIDTH,
  LaunchpadCellContent,
} from '~/features/Toucan/Shared/LaunchpadCell'
import { useAuctionFdvWarningThresholds } from '~/features/Toucan/utils/auctionFdvWarning'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'

export function useTopAuctionsTableColumns({
  showLoadingSkeleton,
  launchpad,
  isCompletedOnlyView,
  sortMethod,
  orderDirection,
  createSortHandler,
}: {
  showLoadingSkeleton: boolean
  launchpad?: AuctionLaunchpadDisplay
  /** Launch threshold isn't meaningful once every visible auction has already resolved. */
  isCompletedOnlyView: boolean
  sortMethod: AuctionSortField | undefined
  orderDirection: OrderDirection
  createSortHandler: (newSortMethod: AuctionSortField) => () => void
}) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const fdvWarningThresholds = useAuctionFdvWarningThresholds()
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)

  const media = useMedia()
  // Primitive deps (not the `launchpad` object) so a refetch of the launchpads registry that
  // produces an equal-but-new object can't rebuild the column defs — a columns identity change
  // remounts every cell (flexRender treats each new `cell` function as a new component type),
  // resetting TokenLogo's load state and flashing the launchpad logo.
  const launchpadLabel = launchpad?.label
  const launchpadLogoUrl = launchpad?.logoUrl
  const launchpadLogoLoading = launchpad?.logoLoading ?? false
  return useMemo(() => {
    const columnHelper = createColumnHelper<TopAuctionsTableValue>()
    const filteredColumns = [
      columnHelper.accessor((row) => row.tokenName, {
        id: 'tokenName',
        // Column sizes sum to 1120 (table max width minus padding) so all columns fit without
        // horizontal scroll — the token column gives up the Launchpad column's width when present.
        size: media.lg ? 190 : launchpadLabel !== undefined ? 268 : 320,
        meta: { collapsedWidth: FLUSH_COLLAPSED_COLUMN_WIDTH },
        header: () => (
          <HeaderCell justifyContent="flex-start" {...(media.lg ? FLUSH_HEADER_CELL_PADDING : undefined)}>
            <Text variant="body3" color="$neutral2" fontWeight="500" numberOfLines={1}>
              {t('explore.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenName) => (
          <Cell
            justifyContent="flex-start"
            loading={showLoadingSkeleton}
            {...(media.lg ? FLUSH_CELL_PADDING : undefined)}
          >
            {tokenName.getValue?.()}
          </Cell>
        ),
      }),
      // Constant per table today (see the `launchpad` prop docs), so the cell reads the resolved
      // display directly instead of a row accessor.
      launchpadLabel !== undefined
        ? columnHelper.accessor((row) => row, {
            id: 'launchpad',
            size: LAUNCHPAD_COLUMN_WIDTH,
            meta: LAUNCHPAD_COLUMN_META,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2" fontWeight="500">
                  {t('launches.table.launchpad')}
                </Text>
              </HeaderCell>
            ),
            cell: () => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <LaunchpadCellContent
                  label={launchpadLabel}
                  logoUrl={launchpadLogoUrl}
                  logoLoading={launchpadLogoLoading}
                />
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row, {
        id: 'projectedFdv',
        size: 180,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.FDV}
              isCurrentSortMethod={sortMethod === AuctionSortField.FDV}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.FDV)}
            />
          </HeaderCell>
        ),
        cell: (row) => (
          <ProjectedFdvCell
            value={row.getValue?.()}
            loading={showLoadingSkeleton}
            convertFiatAmountFormatted={convertFiatAmountFormatted}
            fdvWarningThresholds={fdvWarningThresholds}
          />
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'committedVolume',
        size: 180,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.COMMITTED_VOLUME}
              isCurrentSortMethod={sortMethod === AuctionSortField.COMMITTED_VOLUME}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.COMMITTED_VOLUME)}
            />
          </HeaderCell>
        ),
        cell: (row) => (
          <CommittedVolumeCell
            value={row.getValue?.()}
            loading={showLoadingSkeleton}
            convertFiatAmountFormatted={convertFiatAmountFormatted}
          />
        ),
      }),
      isCompletedOnlyView
        ? null
        : columnHelper.accessor((row) => row, {
            id: 'launchThreshold',
            size: 180,
            header: () => (
              <HeaderCell justifyContent="flex-end">
                <AuctionTableHeader
                  category={AuctionSortField.LAUNCH_THRESHOLD}
                  isCurrentSortMethod={sortMethod === AuctionSortField.LAUNCH_THRESHOLD}
                  direction={orderDirection}
                  onSort={createSortHandler(AuctionSortField.LAUNCH_THRESHOLD)}
                />
              </HeaderCell>
            ),
            cell: (row) => (
              <LaunchThresholdCell
                value={row.getValue?.()}
                loading={showLoadingSkeleton}
                convertFiatAmountFormatted={convertFiatAmountFormatted}
                formatPercent={formatPercent}
              />
            ),
          }),
      columnHelper.accessor((row) => row.auction, {
        id: 'timeRemaining',
        size: 200,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.TIME_REMAINING}
              isCurrentSortMethod={sortMethod === AuctionSortField.TIME_REMAINING}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.TIME_REMAINING)}
            />
          </HeaderCell>
        ),
        cell: (row) => {
          const enrichedAuction = row.getValue?.()
          const timeRemaining = enrichedAuction?.timeRemaining
          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <TimeRemainingCell
                startBlockTimestamp={timeRemaining?.startBlockTimestamp}
                endBlockTimestamp={timeRemaining?.endBlockTimestamp}
                preBidEndBlockTimestamp={timeRemaining?.preBidEndBlockTimestamp}
                tokenAddress={enrichedAuction?.auction?.tokenAddress}
                chainId={enrichedAuction?.auction?.chainId}
                isGraduated={enrichedAuction?.auction?.isGraduated}
                totalBidVolume={enrichedAuction?.auction?.totalBidVolume}
                requiredCurrencyRaised={enrichedAuction?.auction?.requiredCurrencyRaised}
                // QuickLaunch: progress-bar + "Live on Uniswap" treatment for quick launches.
                isQuickLaunch={isQuickLaunchFlagEnabled && !!enrichedAuction && isQuickLaunchAuction(enrichedAuction)}
              />
            </Cell>
          )
        },
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    showLoadingSkeleton,
    media,
    t,
    sortMethod,
    orderDirection,
    convertFiatAmountFormatted,
    formatPercent,
    createSortHandler,
    fdvWarningThresholds,
    isCompletedOnlyView,
    isQuickLaunchFlagEnabled,
    launchpadLabel,
    launchpadLogoUrl,
    launchpadLogoLoading,
  ])
}

import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, TouchableArea, useMedia } from 'ui/src'
import { Pools } from 'ui/src/components/icons/Pools'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { usePoolsPositionsReport } from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { sortPositionsByStatusClosedLast } from 'uniswap/src/features/positions/utils'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import useResizeObserver from 'use-resize-observer'
import { EmptyPositionsView } from '~/features/Liquidity/components/emptyStates/EmptyPositionsView'
import { ErrorPositionsView } from '~/features/Liquidity/components/emptyStates/ErrorPositionsView'
import { PoolsUnavailableOnSolanaView } from '~/features/Liquidity/components/emptyStates/PoolsUnavailableOnSolanaView'
import {
  DEFAULT_LP_POSITION_PROTOCOL_FILTER,
  DEFAULT_LP_POSITION_STATUS_FILTER,
  LP_POSITION_PROTOCOL_VERSIONS,
  LP_POSITION_STATUS_FILTER_OPTIONS,
} from '~/features/Liquidity/constants'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { LiquidityPositionCardLoader } from '~/features/Liquidity/LiquidityPositionCard'
import { PositionsListSection } from '~/features/Liquidity/PositionsListSection'
import { PortfolioBalanceCountIndicator } from '~/pages/Portfolio/components/PortfolioBalanceCountIndicator'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'
import { PortfolioPoolsFeesPanel } from '~/pages/Portfolio/Pools/components/PortfolioPoolsFeesPanel'
import { PortfolioPoolsRewardsCard } from '~/pages/Portfolio/Pools/components/PortfolioPoolsRewardsCard'
import { PoolsActionRow } from '~/pages/Portfolio/Pools/PoolsActionRow'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { useCreatePositionHref } from '~/utils/createPositionRoute'
import { buildImportV2PositionsHref } from '~/utils/importV2PositionsRoute'

const POSITIONS_LIST_MAX_WIDTH = 768
const POSITIONS_SIDEBAR_WIDTH = 360
const FEE_CARD_STACKED_MAX_HEIGHT = 400
const FEE_CARD_MIN_MAX_HEIGHT = 664
const POSITION_STACK_HEIGHT_OFFSET = 110

const PoolsPositionCountIndicator = memo(function PoolsPositionCountIndicator({ count }: { count: number }) {
  const { t } = useTranslation()

  return <PortfolioBalanceCountIndicator label={t('portfolio.pools.balance.totalPositions', { count })} />
})

function positionMatchesSearch(position: PositionInfo, normalizedSearch: string): boolean {
  if (!normalizedSearch) {
    return true
  }

  const currency0 = position.currency0Amount.currency
  const currency1 = position.currency1Amount.currency
  const searchableValues = [
    currency0.symbol,
    currency0.name,
    currency1.symbol,
    currency1.name,
    position.poolId,
    position.tokenId,
  ]

  return searchableValues.some((value) => value?.toLowerCase().includes(normalizedSearch))
}

export function PortfolioPools() {
  const { t } = useTranslation()
  const { evmAddress, isExternalWallet } = usePortfolioAddresses()
  const { evmAddress: resolvedEvmAddress, svmAddress: resolvedSvmAddress } = useResolvedAddresses()
  const { chainId, externalAddress } = usePortfolioRoutes()
  const isLpIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const outageBanner = usePoolsOutageBanner({ evmAddress, chainId, enabled: portfolioPoolsBalancesEnabled })
  const media = useMedia()
  const { ref: positionsListRef, height: positionStackHeight } = useResizeObserver<HTMLElement>()
  const twoColumnFeeCardMaxHeight = positionStackHeight
    ? Math.max(positionStackHeight - POSITION_STACK_HEIGHT_OFFSET, FEE_CARD_MIN_MAX_HEIGHT)
    : undefined
  const feeCardMaxHeight = media.xl ? FEE_CARD_STACKED_MAX_HEIGHT : twoColumnFeeCardMaxHeight

  const [search, setSearch] = useState('')
  const [versionFilter, setVersionFilter] = useState(() => [...DEFAULT_LP_POSITION_PROTOCOL_FILTER])
  const [statusFilter, setStatusFilter] = useState(() => [...DEFAULT_LP_POSITION_STATUS_FILTER])
  const [showHiddenPositions, setShowHiddenPositions] = useState(false)

  const toggleVersion = useCallback((version: ProtocolVersion) => {
    setVersionFilter((prev) => (prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version]))
  }, [])

  const toggleStatus = useCallback((status: PositionStatus) => {
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }, [])

  const clearFiltersAndSearch = useCallback(() => {
    setSearch('')
    setVersionFilter([...DEFAULT_LP_POSITION_PROTOCOL_FILTER])
    setStatusFilter([...DEFAULT_LP_POSITION_STATUS_FILTER])
  }, [])

  // Fetch every status + version once and filter client-side, so toggling a filter never refetches and
  // closed positions stay in memory for the count.
  const {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    refetch,
    loadMorePositions,
    pagesLoaded,
  } = useWalletPositionsWeb({
    address: evmAddress,
    chainFilter: chainId ?? null,
    versionFilter: LP_POSITION_PROTOCOL_VERSIONS,
    statusFilter: LP_POSITION_STATUS_FILTER_OPTIONS,
  })

  usePoolsPositionsReport({
    positions: visiblePositions,
    pagesLoaded,
    hasMore: hasNextPage,
    isLoading: isLoadingPositions,
    enabled: !!evmAddress,
  })

  const { data: poolsBalance } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress,
    chainIds: chainId ? [chainId] : undefined,
  })
  const hasLoadedBalance = poolsBalance !== undefined
  const totalPoolsCount = poolsBalance?.count

  // Backend count (open + closed) is the source of truth; only the Closed filter adjusts it, subtracting
  // in-memory closed positions while it's off.
  const closedStatusSelected = statusFilter.includes(PositionStatus.CLOSED)
  const closedPositionsCount = useMemo(
    () => visiblePositions.filter((position) => position.status === PositionStatus.CLOSED).length,
    [visiblePositions],
  )
  const poolsPositionCount =
    totalPoolsCount === undefined
      ? undefined
      : closedStatusSelected
        ? totalPoolsCount
        : Math.max(0, totalPoolsCount - closedPositionsCount)

  const hasSolanaOnlyWallet = !resolvedEvmAddress && !!resolvedSvmAddress
  const normalizedSearch = search.trim().toLowerCase()
  const matchesPositionFilters = useCallback(
    (position: PositionInfo): boolean =>
      versionFilter.includes(position.version) &&
      statusFilter.includes(position.status) &&
      positionMatchesSearch(position, normalizedSearch),
    [versionFilter, statusFilter, normalizedSearch],
  )
  const filteredVisiblePositions = useMemo(
    () => sortPositionsByStatusClosedLast(visiblePositions.filter(matchesPositionFilters)),
    [visiblePositions, matchesPositionFilters],
  )
  const filteredHiddenPositions = useMemo(
    () => sortPositionsByStatusClosedLast(hiddenPositions.filter(matchesPositionFilters)),
    [hiddenPositions, matchesPositionFilters],
  )
  const hasLoadedPositions = !isLoadingPositions && !hasErrorWithoutData
  const walletHasAnyPositions = visiblePositions.length > 0 || hiddenPositions.length > 0
  const showEmptyState = hasLoadedPositions && !walletHasAnyPositions
  const showNoResults =
    hasLoadedPositions &&
    walletHasAnyPositions &&
    !hasNextPage &&
    filteredVisiblePositions.length === 0 &&
    filteredHiddenPositions.length === 0

  const portfolioPoolsUrl = buildPortfolioUrl({
    tab: PortfolioTab.Pools,
    chainId,
    externalAddress: externalAddress?.address,
  })
  const newPositionHref = useCreatePositionHref({ entryPoint: portfolioPoolsUrl })

  const renderListContent = (): JSX.Element => {
    if (hasErrorWithoutData) {
      return <ErrorPositionsView onRetry={refetch} />
    }
    if (isLoadingPositions) {
      return (
        <Flex gap="$gap16">
          {Array.from({ length: 5 }, (_, index) => (
            <LiquidityPositionCardLoader key={index} />
          ))}
        </Flex>
      )
    }
    if (showNoResults) {
      return (
        <Flex pb="$spacing48">
          <BaseCard.EmptyState
            icon={<Pools size="$icon.64" color="$neutral3" />}
            description={t('portfolio.noResults.filters.title')}
            buttonLabel={t('portfolio.noResults.filters.clear')}
            dataTestId={TestID.PortfolioPoolsNoResults}
            onPress={clearFiltersAndSearch}
          />
        </Flex>
      )
    }
    return (
      <PositionsListSection
        visiblePositions={filteredVisiblePositions}
        hiddenPositions={filteredHiddenPositions}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isPlaceholderData={isPlaceholderData}
        loadMorePositions={loadMorePositions}
        showHiddenPositions={showHiddenPositions}
        setShowHiddenPositions={setShowHiddenPositions}
        hiddenSectionLabel={t('hidden.pools.info.text.button', { numHidden: filteredHiddenPositions.length })}
        hiddenSectionPadding={{ py: '$spacing12', px: 0 }}
        entryPoint={portfolioPoolsUrl}
        readOnly={isExternalWallet}
      />
    )
  }

  const renderContent = (): JSX.Element => {
    if (hasSolanaOnlyWallet) {
      return <PoolsUnavailableOnSolanaView />
    }
    if (showEmptyState) {
      return <EmptyPositionsView newPositionHref={newPositionHref} showNewPositionAction={!isExternalWallet} />
    }

    return (
      <Flex gap="$spacing40">
        <Flex gap="$spacing24">
          <PortfolioBalance
            evmOwner={evmAddress}
            chainIds={chainId ? [chainId] : undefined}
            endText={
              hasLoadedBalance ? (
                poolsPositionCount !== undefined ? (
                  <PoolsPositionCountIndicator count={poolsPositionCount} />
                ) : (
                  <PortfolioBalanceCountIndicator label="-" />
                )
              ) : undefined
            }
            part={PortfolioBalancePart.Pools}
          />
          <PoolsActionRow
            search={search}
            selectedVersions={versionFilter}
            selectedStatus={statusFilter}
            onSearchChange={setSearch}
            onVersionChange={toggleVersion}
            onStatusChange={toggleStatus}
            createPositionEntryPoint={portfolioPoolsUrl}
            showCreateButton={!isExternalWallet}
          />
        </Flex>
        <Flex row gap="$spacing24" alignItems="flex-start" $xl={{ flexDirection: 'column-reverse' }}>
          <Flex grow shrink width="100%" maxWidth={POSITIONS_LIST_MAX_WIDTH} $xl={{ maxWidth: '100%' }}>
            {outageBanner.isVisible && (
              <Flex mb="$spacing16">
                <PoolsDataIssueBanner message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
              </Flex>
            )}
            <Flex ref={positionsListRef}>{renderListContent()}</Flex>
            {!isExternalWallet && (
              <Flex
                row
                alignItems="center"
                mt="$spacing12"
                py="$spacing8"
                gap="$gap8"
                $sm={{ flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Text variant="body3" color="$neutral2">
                  {t('pool.import.link.description')}
                </Text>
                <Anchor href={buildImportV2PositionsHref({ entryPoint: portfolioPoolsUrl })} textDecorationLine="none">
                  <TouchableArea>
                    <Text variant="body3" color="$neutral1">
                      {t('pool.import.positions.v2')}
                    </Text>
                  </TouchableArea>
                </Anchor>
              </Flex>
            )}
          </Flex>
          <Flex
            width={POSITIONS_SIDEBAR_WIDTH}
            flexShrink={0}
            gap="$gap12"
            $xl={{ width: '100%', flexDirection: 'row' }}
            $md={{ flexDirection: 'column' }}
          >
            {isLpIncentivesEnabled && (
              <PortfolioPoolsRewardsCard walletAddress={evmAddress} isExternalWallet={isExternalWallet} />
            )}
            <PortfolioPoolsFeesPanel
              walletAddress={evmAddress}
              chainId={chainId}
              isExternalWallet={isExternalWallet}
              maxHeight={feeCardMaxHeight}
            />
          </Flex>
        </Flex>
      </Flex>
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPoolsPage} properties={{ isExternal: isExternalWallet }}>
      {renderContent()}
    </Trace>
  )
}

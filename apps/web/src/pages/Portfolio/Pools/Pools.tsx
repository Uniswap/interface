import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, TouchableArea } from 'ui/src'
import { Pools } from 'ui/src/components/icons/Pools'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { EmptyPositionsView } from '~/features/Liquidity/components/emptyStates/EmptyPositionsView'
import { ErrorPositionsView } from '~/features/Liquidity/components/emptyStates/ErrorPositionsView'
import { PoolsUnavailableOnSolanaView } from '~/features/Liquidity/components/emptyStates/PoolsUnavailableOnSolanaView'
import { DEFAULT_LP_POSITION_PROTOCOL_FILTER, DEFAULT_LP_POSITION_STATUS_FILTER } from '~/features/Liquidity/constants'
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

const PoolsPositionCountIndicator = memo(function PoolsPositionCountIndicator({ count }: { count: number }) {
  const { t } = useTranslation()

  return <PortfolioBalanceCountIndicator label={t('portfolio.pools.balance.totalPositions', { count })} />
})

function hasSameItems<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((item) => b.includes(item))
}

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
  } = useWalletPositionsWeb({
    address: evmAddress,
    chainFilter: chainId ?? null,
    versionFilter,
    statusFilter,
  })

  const { data: poolsBalance } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress,
    chainIds: chainId ? [chainId] : undefined,
  })
  const hasLoadedBalance = poolsBalance !== undefined
  const totalPoolsCount = poolsBalance?.count

  const hasSolanaOnlyWallet = !resolvedEvmAddress && !!resolvedSvmAddress
  const normalizedSearch = search.trim().toLowerCase()
  const hasModifiedPositionFilters =
    !hasSameItems(versionFilter, DEFAULT_LP_POSITION_PROTOCOL_FILTER) ||
    !hasSameItems(statusFilter, DEFAULT_LP_POSITION_STATUS_FILTER)
  const filteredVisiblePositions = useMemo(
    () => visiblePositions.filter((position) => positionMatchesSearch(position, normalizedSearch)),
    [visiblePositions, normalizedSearch],
  )
  const filteredHiddenPositions = useMemo(
    () => hiddenPositions.filter((position) => positionMatchesSearch(position, normalizedSearch)),
    [hiddenPositions, normalizedSearch],
  )
  const hasLoadedPositions = !isLoadingPositions && !hasErrorWithoutData
  const showEmptyState =
    hasLoadedPositions &&
    visiblePositions.length === 0 &&
    hiddenPositions.length === 0 &&
    !normalizedSearch &&
    !hasModifiedPositionFilters
  const showNoResults =
    hasLoadedPositions &&
    !showEmptyState &&
    filteredVisiblePositions.length === 0 &&
    filteredHiddenPositions.length === 0 &&
    (!!normalizedSearch || hasModifiedPositionFilters)

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
                totalPoolsCount !== undefined ? (
                  <PoolsPositionCountIndicator count={totalPoolsCount} />
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
            {renderListContent()}
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
            <PortfolioPoolsFeesPanel walletAddress={evmAddress} chainId={chainId} isExternalWallet={isExternalWallet} />
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

import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool as PoolIcon } from 'components/Icons/Pool'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl } from 'components/Liquidity/utils'
import { sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { apolloSubgraphClient } from 'graphql/data/apollo/client'
import { OrderDirection } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { atom, useAtom } from 'jotai'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { fromPositionToPositionInfo } from 'lib/utils/subgraph'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useTopPools } from 'state/explore/topPools'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { useRequestPositionsForSavedPairs } from 'state/user/hooks'
import { Anchor, Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'
import { useGetPositionsQuery } from 'v3-subgraph/generated/types-and-hooks'

const PAGE_SIZE = 25

function EmptyPositionsView({ chainId, isConnected }: { chainId?: UniverseChainId | null; isConnected: boolean }) {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  const resetSortMethod = useResetAtom(sortMethodAtom)
  const resetSortAscending = useResetAtom(sortAscendingAtom)

  useEffect(() => {
    resetSortMethod()
    resetSortAscending()
  }, [resetSortAscending, resetSortMethod])

  const {
    data: exploreStatsData,
    isLoading: exploreStatsLoading,
    error: exploreStatsError,
  } = useExploreStatsQuery({
    chainId: chainId ? chainId.toString() : ALL_NETWORKS_ARG,
  })

  const { topPools } = useTopPools(
    { data: exploreStatsData, isLoading: exploreStatsLoading, isError: !!exploreStatsError },
    {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
  )

  return (
    <Flex gap="$spacing32">
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        p="$padding16"
        overflow="hidden"
        cursor={isConnected ? 'auto' : 'pointer'}
        onPress={
          isConnected
            ? undefined
            : () => {
                accountDrawer.toggle()
              }
        }
        $md={{ row: false, gap: '$gap16', alignItems: 'flex-start' }}
      >
        <Flex alignItems="center" row gap="$gap8">
          <Flex p="$padding8" borderRadius="$rounded12" backgroundColor="$accent2">
            <PoolIcon width={iconSizes.icon24} height={iconSizes.icon24} color={colors.accent1.val} />
          </Flex>
          <Flex shrink>
            <Text variant="subheading2">{isConnected ? t('pool.openPosition') : t('positions.welcome')}</Text>
            <Text variant="body2" color="$neutral2">
              {isConnected ? t('pool.openPosition.cta') : t('positions.welcome.connect')}
            </Text>
          </Flex>
        </Flex>
        {isConnected && (
          <Flex centered row $md={{ width: '100%' }}>
            <Button size="small" emphasis="secondary" onPress={() => navigate('/create/v3')}>
              {t('pool.newSpecificPosition', { symbol: 'v3' })}
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

function LearnMoreTile({ img, text, link }: { img: string; text: string; link?: string }) {
  return (
    <Anchor
      href={link}
      textDecorationLine="none"
      hoverStyle={{ textDecorationLine: 'underline' }}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Flex
        row
        width={344}
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth="$spacing1"
        borderStyle="solid"
        alignItems="center"
        gap="$gap16"
        overflow="hidden"
      >
        <img src={img} style={{ objectFit: 'cover', width: '72px', height: '72px' }} />
        <Text variant="subheading2">{text}</Text>
      </Flex>
    </Anchor>
  )
}

const chainFilterAtom = atom<UniverseChainId | null>(null)
const versionFilterAtom = atom<ProtocolVersion[]>([ProtocolVersion.V3, ProtocolVersion.V2])
const statusFilterAtom = atom<PositionStatus[]>([PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE])

export default function Pool() {
  const { t } = useTranslation()
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)

  const media = useMedia()

  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const { chains: currentModeChains } = useEnabledChains()
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [closedCTADismissed, setClosedCTADismissed] = useState(false)

  const account = useAccount()
  const { address, isConnected } = account

  const isPositionVisible = usePositionVisibilityCheck()
  const [showHiddenPositions, setShowHiddenPositions] = useState(false)

  useEffect(() => {
    if (isV4DataEnabled) {
      setVersionFilter([ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2])
    }
  }, [isV4DataEnabled, setVersionFilter])

  const isPlaceholderData = false

  const {
    data,
    loading: isLoading,
    refetch,
  } = useGetPositionsQuery({
    client: apolloSubgraphClient,
    skip: !isConnected,
    variables: {
      where: {
        owner: address,
      },
    },
  })

  const savedPositions = useRequestPositionsForSavedPairs()

  const isLoadingPositions = !!account.address && (isLoading || !data)

  const combinedPositions = (data?.positions ?? []).map(fromPositionToPositionInfo)

  const { visiblePositions, hiddenPositions } = useMemo(() => {
    const visiblePositions: PositionInfo[] = []
    const hiddenPositions: PositionInfo[] = []

    combinedPositions.forEach((position) => {
      const isVisible = isPositionVisible({
        poolId: position.poolId,
        tokenId: position.tokenId,
        chainId: position.chainId,
        isFlaggedSpam: position.isHidden,
      })

      if (isVisible) {
        visiblePositions.push(position)
      } else {
        hiddenPositions.push(position)
      }
    })

    return { visiblePositions, hiddenPositions }
  }, [combinedPositions, isPositionVisible])

  usePendingLPTransactionsChangeListener(refetch)

  const hasNextPage = false
  const isFetching = false
  const fetchNextPage = () => {}

  const loadMorePositions = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  const showingEmptyPositions = !isLoadingPositions && combinedPositions.length === 0

  return (
    <Trace logImpression page={InterfacePageNameLocal.Positions}>
      <Flex
        row
        $xl={{ flexDirection: 'column', gap: '$gap16' }}
        width="100%"
        maxWidth={1200}
        gap={80}
        py="$spacing24"
        px="$spacing40"
        $lg={{ px: '$spacing20' }}
      >
        <Flex grow shrink gap="$spacing24">
          <PositionsHeader
            showFilters={account.isConnected}
            selectedChain={chainFilter}
            selectedVersions={versionFilter}
            selectedStatus={statusFilter}
            onChainChange={(selectedChain) => {
              setChainFilter(selectedChain ?? null)
            }}
            onVersionChange={(toggledVersion) => {
              setVersionFilter((prevVersionFilter) => {
                if (prevVersionFilter.includes(toggledVersion)) {
                  return prevVersionFilter.filter((v) => v !== toggledVersion)
                } else {
                  return [...prevVersionFilter, toggledVersion]
                }
              })
            }}
            onStatusChange={(toggledStatus) => {
              setStatusFilter((prevStatusFilter) => {
                if (prevStatusFilter?.includes(toggledStatus)) {
                  return prevStatusFilter.filter((s) => s !== toggledStatus)
                } else {
                  return [...prevStatusFilter, toggledStatus]
                }
              })
            }}
          />
          {!isLoadingPositions ? (
            combinedPositions.length > 0 ? (
              <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
                {visiblePositions.map((position) => (
                  <Link
                    key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
                    style={{ textDecoration: 'none' }}
                    to={getPositionUrl(position)}
                  >
                    <LiquidityPositionCard showVisibilityOption liquidityPosition={position} showMigrateButton />
                  </Link>
                ))}
                <HiddenPositions
                  showHiddenPositions={showHiddenPositions}
                  setShowHiddenPositions={setShowHiddenPositions}
                  hiddenPositions={hiddenPositions}
                />
              </Flex>
            ) : (
              <EmptyPositionsView chainId={chainFilter} isConnected={isConnected} />
            )
          ) : (
            <Flex gap="$gap16">
              {Array.from({ length: 5 }, (_, index) => (
                <LiquidityPositionCardLoader key={index} />
              ))}
            </Flex>
          )}
          {hasNextPage && (
            <Flex mx="auto">
              <Button emphasis="tertiary" size="small" onPress={loadMorePositions} isDisabled={isFetching}>
                {t('common.loadMore')}
              </Button>
            </Flex>
          )}
          {!statusFilter.includes(PositionStatus.CLOSED) && !closedCTADismissed && account.address && (
            <Flex
              borderWidth="$spacing1"
              borderColor="$surface3"
              borderRadius="$rounded12"
              mb="$spacing24"
              p="$padding12"
              gap="$gap12"
              row
              centered
            >
              <Flex height="100%">
                <InfoCircleFilled color="$neutral2" size="$icon.20" />
              </Flex>
              <Flex grow flexBasis={0}>
                <Text variant="body3" color="$neutral1">
                  <Trans i18nKey="pool.closedCTA.title" />
                </Text>
                <Text variant="body3" color="$neutral2">
                  <Trans i18nKey="pool.closedCTA.description" />
                </Text>
              </Flex>
              <CloseIconWithHover onClose={() => setClosedCTADismissed(true)} size="$icon.20" />
            </Flex>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}

interface HiddenPositionsProps {
  showHiddenPositions: boolean
  setShowHiddenPositions: (showHiddenPositions: boolean) => void
  hiddenPositions: PositionInfo[]
}

function HiddenPositions({ showHiddenPositions, setShowHiddenPositions, hiddenPositions }: HiddenPositionsProps) {
  const { t } = useTranslation()
  return (
    <ExpandoRow
      isExpanded={showHiddenPositions}
      toggle={() => setShowHiddenPositions(!showHiddenPositions)}
      numItems={hiddenPositions.length}
      title={t('common.hidden')}
    >
      <Flex gap="$gap16">
        {hiddenPositions.map((position) => (
          <Link
            key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
            style={{ textDecoration: 'none' }}
            to={getPositionUrl(position)}
          >
            <LiquidityPositionCard showVisibilityOption liquidityPosition={position} isVisible={false} />
          </Link>
        ))}
      </Flex>
    </ExpandoRow>
  )
}

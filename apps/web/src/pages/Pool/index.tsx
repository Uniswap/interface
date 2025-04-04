import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import PROVIDE_LIQUIDITY from 'assets/images/provideLiquidity.png'
import V4_HOOK from 'assets/images/v4Hooks.png'
import { ExpandoRow } from 'components/AccountDrawer/MiniPortfolio/ExpandoRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool as PoolIcon } from 'components/Icons/Pool'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, parseRestPosition } from 'components/Liquidity/utils'
import { TopPoolTable, sortAscendingAtom, sortMethodAtom } from 'components/Pools/PoolTable/PoolTable'
import { OrderDirection } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { atom, useAtom } from 'jotai'
import { useAtomValue, useResetAtom } from 'jotai/utils'
import { PositionsHeader } from 'pages/Pool/Positions/PositionsHeader'
import { TopPools } from 'pages/Pool/Positions/TopPools'
import { ExternalArrowLink } from 'pages/Pool/Positions/shared'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useTopPools } from 'state/explore/topPools'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { useRequestPositionsForSavedPairs } from 'state/user/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { CloseIconWithHover } from 'ui/src/components/icons/CloseIconWithHover'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useGetPositionsInfiniteQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { usePositionVisibilityCheck } from 'uniswap/src/features/visibility/hooks/usePositionVisibilityCheck'

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
            <Button size="small" emphasis="secondary" onPress={() => navigate('/explore/pools')}>
              {t('pools.explore')}
            </Button>
          </Flex>
        )}
      </Flex>
      <Flex gap="$gap24">
        <Text variant="subheading1">
          <Trans i18nKey="pool.top.tvl" />
        </Text>
        <TopPoolTable
          topPoolData={{ topPools, isLoading: exploreStatsLoading, isError: !!exploreStatsError }}
          pageSize={10}
          staticSize
        />
        <ExternalArrowLink href="/explore/pools" openInNewTab={false}>
          {t('explore.more.pools')}
        </ExternalArrowLink>
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

  const { data, isPlaceholderData, refetch, isLoading, fetchNextPage, hasNextPage, isFetching } =
    useGetPositionsInfiniteQuery(
      {
        address,
        chainIds: chainFilter ? [chainFilter] : currentModeChains,
        positionStatuses: statusFilter,
        protocolVersions: versionFilter,
        pageSize: PAGE_SIZE,
        pageToken: '',
        includeHidden: true,
      },
      !isConnected,
    )

  const loadedPositions = useMemo(() => {
    return data?.pages.flatMap((positionsResponse) => positionsResponse.positions) || []
  }, [data])

  const savedPositions = useRequestPositionsForSavedPairs()

  const isLoadingPositions = !!account.address && (isLoading || !data)

  const combinedPositions = useMemo(() => {
    return [
      ...loadedPositions,
      ...(savedPositions
        .filter((position) => {
          const matchesChain = !chainFilter || position.data?.position?.chainId === chainFilter
          const matchesStatus =
            position.data?.position?.status && statusFilter.includes(position.data?.position?.status)
          const matchesVersion =
            position.data?.position?.protocolVersion && versionFilter.includes(position.data?.position?.protocolVersion)
          return matchesChain && matchesStatus && matchesVersion
        })
        .map((p) => p.data?.position) ?? []),
    ]
      .map(parseRestPosition)
      .filter((position): position is PositionInfo => !!position)
      .reduce<PositionInfo[]>((unique, position) => {
        const positionId = `${position.poolId}-${position.tokenId}-${position.chainId}`
        const exists = unique.some((p) => `${p.poolId}-${p.tokenId}-${p.chainId}` === positionId)
        if (!exists) {
          unique.push(position)
        }
        return unique
      }, [])
  }, [loadedPositions, savedPositions, chainFilter, statusFilter, versionFilter])

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
          <Flex row centered $sm={{ flexDirection: 'column', alignItems: 'flex-start' }} mb="$spacing24" gap="$gap4">
            <Text variant="body3" color="$neutral2">
              {t('pool.import.link.description')}
            </Text>
            <Anchor href="/pools/v2/find" textDecorationLine="none">
              <Text variant="body3" color="$neutral1" {...ClickableTamaguiStyle}>
                {t('pool.import.positions.v2')}
              </Text>
            </Anchor>
          </Flex>
        </Flex>
        <Flex gap="$gap32" pt={64} $xl={{ pt: '$spacing12' }}>
          {!media.xl && !showingEmptyPositions && !isLoading && <TopPools chainId={chainFilter} />}
          <Flex gap="$gap20" mb="$spacing24">
            <Text variant="subheading1">{t('liquidity.learnMoreLabel')}</Text>
            <Flex gap="$gap12">
              <LearnMoreTile
                img={PROVIDE_LIQUIDITY}
                text={t('liquidity.provideOnProtocols')}
                link={uniswapUrls.helpArticleUrls.providingLiquidityInfo}
              />
              {isV4DataEnabled && (
                <LearnMoreTile
                  img={V4_HOOK}
                  text={t('liquidity.hooks')}
                  link={uniswapUrls.helpArticleUrls.v4HooksInfo}
                />
              )}
            </Flex>
            <ExternalArrowLink href={uniswapUrls.helpArticleUrls.positionsLearnMore}>
              {t('common.button.learn')}
            </ExternalArrowLink>
          </Flex>
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

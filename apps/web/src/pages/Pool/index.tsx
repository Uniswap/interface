import PROVIDE_LIQUIDITY from 'assets/images/provideLiquidity.png'
/* eslint-disable-next-line no-restricted-imports */
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import V4_HOOK from 'assets/images/v4Hooks.png'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { Pool as PoolIcon } from 'components/Icons/Pool'
import { LiquidityPositionCard, LiquidityPositionCardLoader } from 'components/Liquidity/LiquidityPositionCard'
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
import { ChevronLeft, ChevronRight } from 'react-feather'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTopPools } from 'state/explore/topPools'
import { usePendingLPTransactionsChangeListener } from 'state/transactions/hooks'
import { ClickableTamaguiStyle } from 'theme/components'
import { Anchor, Button, Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { X } from 'ui/src/components/icons/X'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { useGetPositionsQuery } from 'uniswap/src/data/rest/getPositions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag, useFeatureFlagWithLoading } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { Trans, useTranslation } from 'uniswap/src/i18n'

const PAGE_SIZE = 8

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
        borderWidth={1}
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
          <Button theme="secondary" size="medium" onPress={() => navigate('/explore/pools')} $md={{ width: '100%' }}>
            <Text>{t('pools.explore')}</Text>
          </Button>
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
    <Anchor href={link} textDecorationLine="none" hoverStyle={{ textDecorationLine: 'underline' }}>
      <Flex
        row
        width={344}
        borderRadius="$rounded20"
        borderColor="$surface3"
        borderWidth={1}
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
  const { value: lpRedesignEnabled, isLoading: isLoadingFeatureFlag } = useFeatureFlagWithLoading(
    FeatureFlags.LPRedesign,
  )
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)

  const media = useMedia()

  const [chainFilter, setChainFilter] = useAtom(chainFilterAtom)
  const { chains: currentModeChains } = useEnabledChains()
  const [versionFilter, setVersionFilter] = useAtom(versionFilterAtom)
  const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
  const [closedCTADismissed, setClosedCTADismissed] = useState(false)

  const account = useAccount()
  const { address, isConnected } = account
  const [currentPage, setCurrentPage] = useState(0)

  useEffect(() => {
    if (isV4DataEnabled) {
      setVersionFilter([ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2])
    }
  }, [isV4DataEnabled, setVersionFilter])

  const { data, isPlaceholderData, refetch, isLoading } = useGetPositionsQuery(
    {
      address,
      chainIds: chainFilter ? [chainFilter] : currentModeChains,
      positionStatuses: statusFilter,
      protocolVersions: versionFilter,
    },
    !isConnected,
  )
  const isLoadingPositions = !!account.address && (isLoading || !data)

  usePendingLPTransactionsChangeListener(refetch)

  const currentPageItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    return (data?.positions.slice(start, start + PAGE_SIZE) ?? []).map((position) => parseRestPosition(position))
  }, [currentPage, data?.positions])

  const pageCount = data?.positions ? Math.ceil(data?.positions.length / PAGE_SIZE) : undefined
  const showingEmptyPositions = !isLoadingPositions && currentPageItems.length === 0

  if (!isLoadingFeatureFlag && !lpRedesignEnabled) {
    return <Navigate to="/pools" replace />
  }

  if (isLoadingFeatureFlag) {
    return null
  }

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
              if (versionFilter?.includes(toggledVersion)) {
                setVersionFilter(versionFilter?.filter((v) => v !== toggledVersion))
              } else {
                setVersionFilter([...(versionFilter ?? []), toggledVersion])
              }
            }}
            onStatusChange={(toggledStatus) => {
              if (statusFilter?.includes(toggledStatus)) {
                setStatusFilter(statusFilter?.filter((s) => s !== toggledStatus))
              } else {
                setStatusFilter([...(statusFilter ?? []), toggledStatus])
              }
            }}
          />
          {!isLoadingPositions ? (
            currentPageItems.length > 0 ? (
              <Flex gap="$gap16" mb="$spacing16" opacity={isPlaceholderData ? 0.6 : 1}>
                {currentPageItems.map((position) => {
                  return (
                    position && (
                      <Link
                        key={`${position.poolId}-${position.tokenId}-${position.chainId}`}
                        style={{ textDecoration: 'none' }}
                        to={getPositionUrl(position)}
                      >
                        <LiquidityPositionCard
                          isClickableStyle
                          key={`LiquidityPositionCard-${position?.tokenId}`}
                          liquidityPosition={position}
                        />
                      </Link>
                    )
                  )
                })}
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
              <Flex height="100%" onPress={() => setClosedCTADismissed(true)} cursor="pointer">
                <X color="$neutral2" size="$icon.20" />
              </Flex>
            </Flex>
          )}
          {!!pageCount && pageCount > 1 && data?.positions && (
            <Flex row gap="$gap12" alignItems="center" mb="$spacing24" alignSelf="center">
              <ChevronLeft
                size={20}
                {...ClickableTamaguiStyle}
                opacity={currentPage === 0 ? 0.4 : 1}
                onClick={() => {
                  setCurrentPage(Math.max(currentPage - 1, 0))
                }}
              />
              {Array.from({ length: pageCount > 5 ? 3 : pageCount }).map((_, index) => {
                const isSelected = currentPage === index
                return (
                  <Text
                    variant="buttonLabel2"
                    color={isSelected ? '$neutral1' : '$neutral2'}
                    backgroundColor={isSelected ? '$surface3' : 'transparent'}
                    py="$spacing4"
                    px="$spacing12"
                    borderRadius="$roundedFull"
                    key={`Positions-page-${index}`}
                    {...ClickableTamaguiStyle}
                    onPress={() => setCurrentPage(index)}
                  >
                    {index + 1}
                  </Text>
                )
              })}
              {pageCount > 5 && (
                <Text variant="buttonLabel2" color="$neutral2" py="$spacing4" px="$spacing12">
                  ...
                </Text>
              )}
              {pageCount > 5 && (
                <Text
                  variant="buttonLabel2"
                  color={currentPage === pageCount - 1 ? '$neutral1' : '$neutral2'}
                  backgroundColor={currentPage === pageCount - 1 ? '$surface3' : 'transparent'}
                  py="$spacing4"
                  px="$spacing12"
                  borderRadius="$roundedFull"
                  {...ClickableTamaguiStyle}
                  onPress={() => setCurrentPage(pageCount - 1)}
                >
                  {pageCount}
                </Text>
              )}
              <ChevronRight
                size={20}
                {...ClickableTamaguiStyle}
                opacity={currentPage === pageCount - 1 ? 0.4 : 1}
                onClick={() => {
                  setCurrentPage(Math.min(currentPage + 1, pageCount - 1))
                }}
              />
            </Flex>
          )}
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
